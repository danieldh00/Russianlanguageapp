// "YYYY-MM-DD" and "HH:MM" as the clock reads right now in a given IANA
// time zone; falls back to UTC for an unknown zone. Shared by the push and
// Home Assistant reminder schedulers.
function localNow(timeZone) {
  let s;
  try {
    s = new Date().toLocaleString('sv-SE', { timeZone });
  } catch (err) {
    s = new Date().toLocaleString('sv-SE', { timeZone: 'UTC' });
  }
  return { date: s.slice(0, 10), time: s.slice(11, 16) };
}

module.exports = { localNow };
