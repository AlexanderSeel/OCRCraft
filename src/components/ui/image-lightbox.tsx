"use client";

import { useState } from "react";
import { Dialog } from "./dialog";

interface ImageLightboxProps {
  readonly src: string;
  readonly alt: string;
  readonly className?: string;
  readonly containerClassName?: string;
  readonly loading?: "eager" | "lazy";
  readonly onError?: () => void;
}

export function ImageLightbox({ src, alt, className = "h-full w-full object-contain", containerClassName = "relative", loading = "lazy", onError }: ImageLightboxProps) {
  const [open, setOpen] = useState(false);
  return <>
    <div className={`group/image-lightbox ${containerClassName}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt={alt} className={className} loading={loading} onError={onError} src={src} />
      <button
        aria-label={`${alt || "Bild"} vergrößern`}
        className="absolute right-2 top-2 z-10 grid size-10 place-items-center rounded-full border border-white/70 bg-black/65 text-white opacity-100 shadow-lg transition-opacity hover:bg-black/80 focus-visible:opacity-100 sm:opacity-0 sm:group-hover/image-lightbox:opacity-100"
        onClick={() => setOpen(true)}
        type="button"
      >
        <span aria-hidden="true" className="block size-5">
          <svg fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2.5" />
            <path d="m16 16 5 5" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />
          </svg>
        </span>
      </button>
    </div>
    {open ? (
      <Dialog eyebrow="Bildvorschau" onClose={() => setOpen(false)} size="wide" title={alt || "Bild vergrößern"}>
        <div className="flex max-h-[70vh] items-center justify-center overflow-auto rounded-xl bg-black/10 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={alt} className="max-h-[68vh] max-w-full object-contain" src={src} />
        </div>
      </Dialog>
    ) : null}
  </>;
}
