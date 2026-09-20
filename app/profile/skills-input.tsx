'use client';

import { useMemo, useRef, useState } from 'react';

export default function SkillsInput({
  name,
  defaultValue,
  suggestions,
}: {
  name: string;
  defaultValue: string[];
  suggestions: string[];
}) {
  const [selected, setSelected] = useState<string[]>(defaultValue ?? []);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedLower = useMemo(
    () => new Set(selected.map((s) => s.toLowerCase())),
    [selected],
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return suggestions
      .filter((s) => !selectedLower.has(s.toLowerCase()))
      .filter((s) => (q ? s.toLowerCase().includes(q) : true))
      .slice(0, 8);
  }, [suggestions, selectedLower, query]);

  const qTrimmed = query.trim();
  const showOther =
    qTrimmed.length > 0 && !selectedLower.has(qTrimmed.toLowerCase());

  function add(value: string) {
    const v = value.trim();
    if (!v || selectedLower.has(v.toLowerCase())) return;
    setSelected((prev) => [...prev, v]);
    setQuery('');
  }

  function remove(value: string) {
    setSelected((prev) => prev.filter((s) => s !== value));
  }

  return (
    <div>
      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {selected.map((s) => (
            <span
              key={s}
              className="flex items-center gap-1 rounded-full bg-[#1E4D38] px-2 py-0.5 text-xs text-white"
            >
              {s}
              <button
                type="button"
                aria-label={`Remove ${s}`}
                onClick={() => remove(s)}
                className="font-bold"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            blurTimer.current = setTimeout(() => setOpen(false), 120);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (filtered.length > 0 && !qTrimmed) add(filtered[0]);
              else if (qTrimmed) add(filtered[0] ?? qTrimmed);
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
          placeholder="Type to search skills…"
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
        />
        {open && (filtered.length > 0 || showOther) && (
          <ul
            role="listbox"
            className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg"
          >
            {filtered.map((s) => (
              <li key={s} role="option" aria-selected={false}>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => add(s)}
                >
                  {s}
                </button>
              </li>
            ))}
            {showOther && (
              <li role="option" aria-selected={false}>
                <button
                  type="button"
                  className="block w-full border-t border-gray-100 px-3 py-2 text-left text-sm font-medium hover:bg-gray-100"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => add(qTrimmed)}
                >
                  Other (specify): “{qTrimmed}”
                </button>
              </li>
            )}
          </ul>
        )}
      </div>
      <input type="hidden" name={name} value={selected.join(', ')} />
      <p className="mt-1 text-xs text-gray-500">
        Pick from the list, or type a new skill and choose Other (specify).
      </p>
    </div>
  );
}
