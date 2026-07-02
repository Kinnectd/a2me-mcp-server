import type { ReactNode } from 'react';

/** Simplified A2Me DNA-helix mark, white on the brand black tile. */
export function HelixMark() {
  return (
    <span className="a2me-mark" aria-hidden>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M7 3c0 4 10 5 10 9s-10 5-10 9"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M17 3c0 4-10 5-10 9s10 5 10 9"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="10.4" cy="8.2" r="1" fill="#fff" />
        <circle cx="13.6" cy="8.2" r="1" fill="#fff" />
        <circle cx="10.4" cy="15.8" r="1" fill="#fff" />
        <circle cx="13.6" cy="15.8" r="1" fill="#fff" />
      </svg>
    </span>
  );
}

export function Header({ title, sub }: { title: string; sub?: ReactNode }) {
  return (
    <div className="a2me-header">
      <HelixMark />
      <h1>{title}</h1>
      {sub != null && <span className="a2me-sub">{sub}</span>}
    </div>
  );
}

export function Footer() {
  return (
    <div className="a2me-foot">
      <span className="a2me-chip">A2Me</span>
      <span>· read-only, scoped to your family</span>
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, photoUrl }: { name: string; photoUrl?: string | null }) {
  return (
    <span className="a2me-avatar" aria-hidden>
      {photoUrl ? <img src={photoUrl} alt="" loading="lazy" /> : initials(name)}
    </span>
  );
}
