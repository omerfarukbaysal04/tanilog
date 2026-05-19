/**
 * Türkiye zaman dilimi (UTC+3) için tarih/saat formatlama yardımcıları.
 *
 * Backend UTC döner. Bu yardımcılar UTC string'i Europe/Istanbul'a çevirip
 * `tr-TR` lokal formatla string'e döker.
 */

const TR_TZ = 'Europe/Istanbul';

function parse(raw: string | Date | null | undefined): Date | null {
  if (!raw) return null;
  const d = raw instanceof Date ? raw : new Date(raw);
  if (isNaN(d.getTime())) return null;
  return d;
}

export function fmtDateTimeTR(raw: string | Date | null | undefined): string {
  const d = parse(raw);
  if (!d) return '';
  return d.toLocaleString('tr-TR', {
    timeZone: TR_TZ,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function fmtShortTR(raw: string | Date | null | undefined): string {
  const d = parse(raw);
  if (!d) return '';
  return d.toLocaleString('tr-TR', {
    timeZone: TR_TZ,
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function fmtDateTR(raw: string | Date | null | undefined): string {
  const d = parse(raw);
  if (!d) return '';
  return d.toLocaleDateString('tr-TR', {
    timeZone: TR_TZ,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function fmtTimeTR(raw: string | Date | null | undefined): string {
  const d = parse(raw);
  if (!d) return '';
  return d.toLocaleTimeString('tr-TR', {
    timeZone: TR_TZ,
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function todayTR(): string {
  // YYYY-MM-DD (TR günü)
  const d = new Date();
  const tr = new Date(d.toLocaleString('en-US', { timeZone: TR_TZ }));
  return `${tr.getFullYear()}-${String(tr.getMonth() + 1).padStart(2, '0')}-${String(tr.getDate()).padStart(2, '0')}`;
}
