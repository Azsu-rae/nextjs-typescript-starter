const COLORS = [
  'bg-blue-600',
  'bg-green-600',
  'bg-purple-600',
  'bg-orange-600',
  'bg-pink-600',
  'bg-teal-600',
];

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function colorFor(name: string | null | undefined): string {
  if (!name) return COLORS[0];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COLORS[h % COLORS.length];
}

export default function OrgAvatar({
  name,
  logoUrl,
  size = 36,
}: {
  name: string | null;
  logoUrl?: string | null;
  size?: number;
}) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={logoUrl}
        alt={`${name ?? 'Organization'} logo`}
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${colorFor(name)}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </span>
  );
}
