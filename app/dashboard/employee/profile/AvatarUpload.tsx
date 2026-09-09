"use client";

import { useRef, useState, useTransition } from "react";
import { updateAvatar } from "@/app/actions/profile";

type Props = {
  initials: string;
  currentAvatar: string | null;
};

export default function AvatarUpload({ initials, currentAvatar }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentAvatar);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > 500 * 1024) {
      setError("Image must be under 500 KB.");
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setPreview(base64);
      startTransition(async () => {
        const result = await updateAvatar(base64);
        if (result?.error) {
          setError(result.error);
          return;
        }

        if (result?.avatarUrl) {
          setPreview(result.avatarUrl);
        }
      });
    };
    reader.readAsDataURL(file);

    // reset so same file can be re-selected
    e.target.value = "";
  }

  return (
    <div className="relative w-[88px] h-[88px]">
      {/* Avatar circle */}
      <div className="w-full h-full rounded-full ring-[3px] ring-card shadow-lg overflow-hidden bg-primary flex items-center justify-center">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Profile photo"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-primary-foreground text-2xl font-bold font-serif select-none">
            {initials}
          </span>
        )}
      </div>

      {/* Loading overlay */}
      {isPending && (
        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        </div>
      )}

      {/* Camera button */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
        title="Change profile photo"
        className="absolute bottom-0.5 right-0.5 w-7 h-7 rounded-full bg-foreground text-background border-2 border-card shadow flex items-center justify-center disabled:opacity-50 hover:bg-foreground/80"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {/* Error tooltip */}
      {error && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-10 text-xs text-destructive bg-card border border-destructive/30 rounded-lg px-3 py-1.5 shadow-sm whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
}
