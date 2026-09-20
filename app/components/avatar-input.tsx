'use client';

import { useRef, useState } from 'react';

const MAX_DIM = 256;
const MAX_BYTES = 400_000;

function resizeToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image'));
    };
    img.src = url;
  });
}

export default function AvatarInput({
  name,
  defaultValue,
  label,
}: {
  name: string;
  defaultValue?: string | null;
  label: string;
}) {
  const [value, setValue] = useState<string>(defaultValue ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPick(file: File | undefined) {
    setError('');
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('المرجو اختيار ملف صورة.');
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await resizeToDataUrl(file);
      if (dataUrl.length > MAX_BYTES) {
        setError('الصورة كبيرة جدا حتى بعد التصغير — جرب ملفا أصغر.');
        return;
      }
      setValue(dataUrl);
    } catch {
      setError('تعذر قراءة الصورة.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div>
      <p className="text-sm">{label}</p>
      <div className="mt-1 flex items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt="معاينة"
            width={56}
            height={56}
            className="rounded-full object-cover"
            style={{ width: 56, height: 56 }}
          />
        ) : (
          <span className="flex items-center justify-center rounded-full bg-gray-200 text-sm text-gray-500" style={{ width: 56, height: 56 }}>
            ?
          </span>
        )}
        <div className="flex gap-2">
          <label className="cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-sm">
            {busy ? 'جار المعالجة…' : value ? 'تغيير…' : 'رفع…'}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={busy}
              onChange={(e) => onPick(e.target.files?.[0])}
            />
          </label>
          {value && (
            <button
              type="button"
              onClick={() => setValue('')}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-red-700"
            >
              إزالة
            </button>
          )}
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
