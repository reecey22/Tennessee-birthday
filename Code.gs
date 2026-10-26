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
