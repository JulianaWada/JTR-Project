"use client";

import { useRef, useState } from "react";

/**
 * Picks a picture, shrinks it in the browser (so uploads stay small on slow connections) and puts it in a hidden
 * field as a data URL. "Remove" clears it. The server checks the result again.
 */
export function ImagePicker({ name, label, current, shape = "square", hint }: { name: string; label: string; current: string | null; shape?: "square" | "round"; hint?: string }) {
  const [preview, setPreview] = useState<string | null>(current);
  const [value, setValue] = useState<string>("keep");
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function pick(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      setError("Please choose a PNG, JPG or WebP picture.");
      return;
    }
    const bitmap = await createImageBitmap(file).catch(() => null);
    if (!bitmap) {
      setError("That picture couldn't be opened.");
      return;
    }
    const max = 512;
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    // PNG keeps a logo's transparent background; photos are smaller as JPEG.
    let data = canvas.toDataURL(file.type === "image/jpeg" ? "image/jpeg" : "image/png", 0.86);
    if (data.length > 380_000) data = canvas.toDataURL("image/jpeg", 0.8);
    setPreview(data);
    setValue(data);
  }

  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex items-center gap-4">
        <span className={`grid size-20 shrink-0 place-items-center overflow-hidden border border-line bg-white ${shape === "round" ? "rounded-full" : "rounded-xl"}`}>
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- local preview of the chosen picture
            <img src={preview} alt="" className={`size-full ${shape === "round" ? "object-cover" : "object-contain p-1"}`} />
          ) : (
            <span className="text-xs text-muted">None</span>
          )}
        </span>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary btn-sm" onClick={() => input.current?.click()}>
            {preview ? "Change" : "Upload"}
          </button>
          {preview && (
            <button
              type="button"
              className="btn-sm text-sm font-medium text-danger hover:underline"
              onClick={() => {
                setPreview(null);
                setValue("remove");
                if (input.current) input.current.value = "";
              }}
            >
              Remove
            </button>
          )}
        </div>
      </div>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" tabIndex={-1} onChange={(e) => pick(e.target.files?.[0])} />
      <input type="hidden" name={name} value={value} />
      {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
