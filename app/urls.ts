export function asExternalUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const v = raw.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v}`;
}
