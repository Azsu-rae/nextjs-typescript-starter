'use client';

import { useEffect, useRef, useState } from 'react';
import OrgAvatar from 'app/components/org-avatar';

export default function ProfileMenu({
  name,
  avatarUrl,
  children,
}: {
  name: string;
  avatarUrl?: string | null;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Profile menu"
        className="block rounded-full"
      >
        <OrgAvatar name={name} logoUrl={avatarUrl} size={34} />
      </button>
      {open && (
        <div
          role="menu"
          onClick={() => setOpen(false)}
          className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
        >
          {children}
        </div>
      )}
    </div>
  );
}
