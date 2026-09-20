'use client';

import { useState } from 'react';

export default function Slideshow({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [i, setI] = useState(0);
  if (!images || images.length === 0) return null;

  if (images.length === 1) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={images[0]}
        alt={title}
        className="mt-3 h-44 w-full rounded-lg object-cover"
        loading="lazy"
      />
    );
  }

  const go = (d: number) => setI((prev) => (prev + d + images.length) % images.length);

  return (
    <div className="relative mt-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[i]}
        alt={`${title} (${i + 1}/${images.length})`}
        className="h-44 w-full rounded-lg object-cover"
        loading="lazy"
      />
      <button
        type="button"
        aria-label="Previous image"
        onClick={() => go(-1)}
        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-2 py-1 text-sm text-white"
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Next image"
        onClick={() => go(1)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-2 py-1 text-sm text-white"
      >
        ›
      </button>
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
        {images.map((src, idx) => (
          <button
            key={src}
            type="button"
            aria-label={`Go to image ${idx + 1}`}
            onClick={() => setI(idx)}
            className={`h-2 w-2 rounded-full ${idx === i ? 'bg-white' : 'bg-white/50'}`}
          />
        ))}
      </div>
      <span className="absolute right-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[11px] text-white">
        {i + 1}/{images.length}
      </span>
    </div>
  );
}
