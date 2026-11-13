/**
 * Daniel & Joedie — Wedding RSVP backend (Google Apps Script)
 *
 * What it does
 *  - doPost : receives the RSVP form from index.html and appends a row to the "RSVP" sheet
 *  - doGet  : returns the guests' messages (newest first) so they appear on the invitation
 *  - setup  : run ONCE from the editor — creates the sheets, headers, formatting and a live "Summary" tab
 *
 * Bound to a Google Sheet: open the Sheet → Extensions → Apps Script → paste this file.
 * Full instructions: see README.md
 */

const SHEET_NAME   = 'RSVP';
const SUMMARY_NAME = 'Summary';
const HEADERS      = ['Timestamp', 'Name', 'Attendance', 'Guests', 'Message'];
const MAX_WISHES   = 100;   // how many latest messages the invitation shows

// Must match the values in index.html exactly
const ATTENDANCE = [
  'Yes, Holy Matrimony & Reception',
  'Yes, Holy Matrimony only',
  'Yes, Reception only',
  'Unable to attend either'
];

/* ------------------------------------------------------------------ */
/*  RUN ONCE: creates & formats the sheets                             */
/* ------------------------------------------------------------------ */
function setup() {
  const sheet = getSheet_();
  buildSummary_();
  SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(sheet);
  Logger.log('Setup complete. Now deploy as a Web app (see README).');
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME, 0);

  if (sh.getLastRow() === 0 || sh.getRange(1, 1).getValue() !== HEADERS[0]) {
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
  sh.getRange(1, 1, 1, HEADERS.length)
    .setFontWeight('bold').setBackground('#F6E6A0').setFontColor('#46413A');
  sh.setFrozenRows(1);

  // Plain-text columns: guest input can never be interpreted as a formula
  sh.getRange('B:B').setNumberFormat('@');
  sh.getRange('C:C').setNumberFormat('@');
  sh.getRange('E:E').setNumberFormat('@');
  sh.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm:ss');
  sh.getRange('D:D').setNumberFormat('0').setHorizontalAlignment('center');

  sh.setColumnWidth(1, 150);
  sh.setColumnWidth(2, 200);
  sh.setColumnWidth(3, 230);
  sh.setColumnWidth(4, 70);
  sh.setColumnWidth(5, 420);
  sh.getRange('E:E').setWrap(true).setVerticalAlignment('top');
  return sh;
}

function buildSummary_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SUMMARY_NAME);
  if (!sh) sh = ss.insertSheet(SUMMARY_NAME);
  sh.clear();

  const R = SHEET_NAME;
  const rows = [
    ['RSVP SUMMARY — Daniel & Joedie', '', ''],
    ['', '', ''],
    ['Attendance', 'Responses', 'Total guests']
  ];
  ATTENDANCE.forEach((a, i) => {
    const r = 4 + i;
    rows.push([
      a,
      '=COUNTIF(' + R + '!$C$2:$C,A' + r + ')',
      '=SUMIF(' + R + '!$C$2:$C,A' + r + ',' + R + '!$D$2:$D)'
    ]);
  });
  rows.push(['', '', '']);
  rows.push(['TOTAL RESPONSES', '=COUNTA(' + R + '!$B$2:$B)', '']);
  rows.push(['TOTAL GUESTS ATTENDING (any event)', '', '=SUM(C4:C6)']);
  rows.push(['Guests at Holy Matrimony (09:00 am)', '', '=C4+C5']);
  rows.push(['Guests at Reception (11:00 am)', '', '=C4+C6']);
  rows.push(['Not attending (responses)', '=B7', '']);

  sh.getRange(1, 1, rows.length, 3).setValues(rows.map(r => r.map(v => v)));
  // setValues treats strings starting with "=" as formulas — good here.

  sh.getRange('A1').setFontSize(14).setFontWeight('bold');
  sh.getRange('A3:C3').setFontWeight('bold').setBackground('#F6E6A0');
  sh.getRange('A9:C9').setFontWeight('bold').setBackground('#DDEAE8');
  sh.getRange('A10:C10').setFontWeight('bold').setBackground('#DDEAE8');
  sh.getRange('B3:C14').setHorizontalAlignment('center');
  sh.setColumnWidth(1, 320); sh.setColumnWidth(2, 110); sh.setColumnWidth(3, 120);
}

/* ------------------------------------------------------------------ */
/*  POST — save an RSVP                                                */
/* ------------------------------------------------------------------ */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const p = (e && e.parameter) || {};

    // Honeypot: bots fill hidden fields, humans don't
    if (p.website) return json_({ ok: true });

    const name       = clean_(p.name, 80);
    const attendance = clean_(p.attendance, 60);
    const message    = clean_(p.message, 300);
    let guests       = parseInt(p.guests, 10);

    if (!name) return json_({ ok: false, error: 'Name is required' });
    if (ATTENDANCE.indexOf(attendance) === -1) return json_({ ok: false, error: 'Invalid attendance' });
    if (isNaN(guests) || guests < 0 || guests > 2) guests = 1;
    if (attendance === 'Unable to attend either') guests = 0;
    if (attendance !== 'Unable to attend either' && guests === 0) guests = 1;

    getSheet_().appendRow([new Date(), name, attendance, guests, message]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

/* ------------------------------------------------------------------ */
/*  GET — list guest messages (name + message + time only)             */
/* ------------------------------------------------------------------ */
function doGet(e) {
  const action = e && e.parameter && e.parameter.action;
  if (action === 'wishes') {
    const sh = getSheet_();
    const last = sh.getLastRow();
    let wishes = [];
    if (last > 1) {
      const data = sh.getRange(2, 1, last - 1, HEADERS.length).getValues();
      for (let i = data.length - 1; i >= 0 && wishes.length < MAX_WISHES; i--) {
        const msg = String(data[i][4] || '').trim();
        if (!msg) continue;
        const ts = data[i][0] instanceof Date ? data[i][0].toISOString() : '';
        wishes.push({ name: String(data[i][1] || ''), message: msg, ts: ts });
      }
    }
    return json_({ ok: true, wishes: wishes });
  }
  return json_({ ok: true, service: 'Wedding RSVP API is running' });
}

/* ------------------------------------------------------------------ */
function clean_(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
