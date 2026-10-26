/** @OnlyCurrentDoc */

/**
 * Niah's Day Out in Tennessee — RSVP backend
 * Paste this whole file into Extensions > Apps Script in your Google Sheet,
 * then Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone).
 */
const SHEET_NAME = 'RSVPs';
const HEADERS = ['id', 'key', 'name', 'status', 'dates', 'activities', 'car', 'note', 'updatedAt'];
const STATUSES = ['yes', 'maybe', 'no'];
const DATES = ['nov14', 'nov15', 'nov21', 'nov22'];
const ACTS = ['ride', 'walk', 'zip', 'lights'];
const CARS = ['ride', 'drive', 'meet', ''];
const MSG_SHEET = 'Messages';
const MAX_MESSAGES_PER_DAY = 40; // stops a flood of emails if someone abuses the form

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function list_(value) {
  return String(value || '').split(',').map(function (x) { return x.trim(); }).filter(String);
}

// Stops names like "=SUM(...)" from being treated as spreadsheet formulas.
function clean_(value, max) {
  let s = String(value == null ? '' : value).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

// Everyone's RSVPs, without the private keys.
function doGet() {
  const rows = sheet_().getDataRange().getValues().slice(1);
  const rsvps = rows.filter(function (r) { return r[0]; }).map(function (r) {
    return {
      id: String(r[0]),
      name: String(r[2]),
      status: String(r[3]),
      dates: list_(r[4]),
      acts: list_(r[5]),
      car: String(r[6]),
      note: String(r[7]),
      updatedAt: r[8] instanceof Date ? r[8].toISOString() : String(r[8])
    };
  });
  return json_({ ok: true, rsvps: rsvps });
}

// Add or update one person's RSVP. Only the device that created it (matching key) can change it.
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.type === 'message') return message_(d);
    const id = String(d.id || '').slice(0, 64);
    const key = String(d.key || '').slice(0, 64);
    if (!id || !key) return json_({ ok: false, error: 'missing_id' });
    const name = clean_(d.name, 60);
    if (!name) return json_({ ok: false, error: 'missing_name' });
    const status = STATUSES.indexOf(d.status) >= 0 ? d.status : '';
    if (!status) return json_({ ok: false, error: 'missing_status' });
    const dates = (d.dates || []).filter(function (x) { return DATES.indexOf(x) >= 0; }).join(',');
    const acts = (d.acts || []).filter(function (x) { return ACTS.indexOf(x) >= 0; }).join(',');
    const car = CARS.indexOf(d.car) >= 0 ? d.car : '';
    const note = clean_(d.note, 400);
    const record = [id, key, name, status, dates, acts, car, note, new Date()];

    const sh = sheet_();
    const values = sh.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0]) === id) {
        if (String(values[i][1]) !== key) return json_({ ok: false, error: 'not_yours' });
        sh.getRange(i + 1, 1, 1, record.length).setValues([record]);
        return json_({ ok: true, updated: true });
      }
    }
    if (values.length > 500) return json_({ ok: false, error: 'full' });
    sh.appendRow(record);
    return json_({ ok: true, created: true });
  } catch (err) {
    return json_({ ok: false, error: 'bad_request' });
  } finally {
    lock.releaseLock();
  }
}

// A note for Niah: saved to the Messages tab and emailed to the sheet's owner. Never shown on the page.
function message_(d) {
  const text = clean_(d.text, 500);
  if (!text) return json_({ ok: false, error: 'missing_text' });
  const name = clean_(d.name, 60) || 'Someone';

  const props = PropertiesService.getScriptProperties();
  const day = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const countKey = 'messages_' + day;
  const sent = Number(props.getProperty(countKey) || 0);
  if (sent >= MAX_MESSAGES_PER_DAY) return json_({ ok: false, error: 'limit' });
  props.setProperty(countKey, String(sent + 1));

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(MSG_SHEET);
  if (!sh) {
    sh = ss.insertSheet(MSG_SHEET);
    sh.appendRow(['time', 'name', 'message']);
    sh.setFrozenRows(1);
  }
  sh.appendRow([new Date(), name, text]);

  const plain = function (s) { return String(s).replace(/^'/, ''); };
  MailApp.sendEmail({
    to: Session.getEffectiveUser().getEmail(),
    subject: 'Trip page message from ' + plain(name),
    body: plain(name) + ' wrote:\n\n' + plain(text) + '\n\nAll messages: ' + ss.getUrl()
  });
  return json_({ ok: true });
}
