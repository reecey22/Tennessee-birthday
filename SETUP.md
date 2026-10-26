# Niah's Day Out: setup guide

About 15 minutes, all free. You'll end up with:
- a **Google Sheet** that collects every RSVP (you can read and edit it any time)
- the **trip page** online at a link you can text to friends (no accounts needed for them)

Files in this folder:
- `index.html`: the trip page
- `Code.gs`: the script that connects the page to your Google Sheet

---

## Step 1: Make the Google Sheet

1. Go to **sheets.new** while signed in to Google.
2. Name it something like **Niah Trip RSVPs**.

## Step 2: Add the script

1. In the sheet, click **Extensions → Apps Script**.
2. Delete everything in the editor, then paste in the whole contents of `Code.gs`.
3. Click the **Save** icon.

## Step 3: Publish the script

1. Click **Deploy → New deployment**.
2. Click the gear next to "Select type" and choose **Web app**.
3. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**, then **Authorize access** and pick your Google account.
   - Google will warn that the app isn't verified. That's expected for your own script: click **Advanced → Go to (project name) (unsafe) → Allow**.
5. Copy the **Web app URL**. It ends in `/exec`.

## Step 4: Connect the page

1. Open `index.html` in any text editor (TextEdit, Notepad, VS Code).
2. Search for `PASTE_YOUR_WEB_APP_URL_HERE`.
3. Replace it with your Web app URL, keeping the quotes:
   ```js
   const SCRIPT_URL = "https://script.google.com/macros/s/AKfy.../exec";
   ```

## Step 5 (optional): Add the soundtrack

1. Find the song on YouTube, for example the official audio of "SWEET ★ HONEY ★ BUCKIIN'", and copy the link.
2. In `index.html`, search for `const MUSIC_URL = "";` and paste the link between the quotes:
   ```js
   const MUSIC_URL = "https://www.youtube.com/watch?v=...";
   ```
3. Save the file.

Browsers don't allow sound the moment a page opens, so the music starts on the visitor's first tap or click anywhere. A gold **Play the soundtrack** button in the corner lets them pause it. Leave the link empty and the button stays hidden.

## Step 6: Put the page online

**Netlify Drop (easiest)**
1. Go to **app.netlify.com/drop**.
2. Drag this whole folder onto the page.
3. You'll get a link like `random-name-123.netlify.app`. Create a free account to keep it, and rename it under **Site configuration → Change site name**, for example `niahs-day-out.netlify.app`.

**Or GitHub Pages**
1. Make a **public** repository and upload `index.html`.
2. Go to **Settings → Pages**, choose your main branch, and save. The link appears after a minute.

Anyone with the link can see the page, but it isn't listed or searchable.

## Step 7: Test it, then share

1. Open your link, fill in the form as yourself, and save.
2. Check the sheet: a new row should appear in the **RSVPs** tab.
3. Text the link to the group.

---

## Good to know

- **Changing an RSVP:** friends come back on the same phone or browser and save again. Their row updates instead of duplicating.
- **Fixing things yourself:** edit or delete any row directly in the sheet. Don't change the header row.
- **Guest list refresh:** the page reloads the list every 30 seconds while it's open.
- **If you edit `Code.gs` later:** use **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy** so the same URL keeps working.
- **Privacy:** anyone with the page link can read the names, choices, and notes on the guest list. Each RSVP's private key stays in the sheet and is never sent to the page.
