// @ts-check
// Exportación a iCalendar (RFC 5545). Al añadirlo al Calendario del iPhone, los
// avisos suenan aunque Jarvis esté cerrado.

/** @typedef {{ uid: string, title: string, start: number, end: number, location?: string, reminderMin?: number }} IcsItem */

/** @param {number} ms */
function stamp(ms) {
  return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** @param {string} s */
function escapeText(s) {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Pliega líneas de más de 75 octetos, sin partir caracteres UTF-8. */
function fold(/** @type {string} */ line) {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const out = [];
  let cur = '';
  let limit = 75;
  for (const ch of line) {
    if (enc.encode(cur + ch).length > limit) {
      out.push(cur);
      cur = ch;
      limit = 74;
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.join('\r\n ');
}

/**
 * @param {IcsItem[]} items
 * @param {number} now
 */
export function buildIcs(items, now) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Jarvis//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  for (const it of items) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${it.uid}@jarvis`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART:${stamp(it.start)}`,
      `DTEND:${stamp(it.end)}`,
      `SUMMARY:${escapeText(it.title)}`,
    );
    if (it.location) lines.push(`LOCATION:${escapeText(it.location)}`);
    if (it.reminderMin && it.reminderMin > 0) {
      lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escapeText(it.title)}`, `TRIGGER:-PT${it.reminderMin}M`, 'END:VALARM');
    }
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return `${lines.map(fold).join('\r\n')}\r\n`;
}

/**
 * Comparte o descarga un fichero. En iPhone, compartir un .ics abre la opción de
 * añadirlo al Calendario.
 * @param {string} content
 * @param {string} filename
 * @param {string} type
 */
export async function shareFile(content, filename, type) {
  const file = new File([content], filename, { type });
  const nav = /** @type {Navigator & { canShare?: (d: ShareData) => boolean }} */ (navigator);
  if (nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: filename });
      return;
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
