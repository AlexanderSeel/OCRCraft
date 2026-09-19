"use client";

import { useState } from "react";
import { ImageLightbox } from "@/components/ui/image-lightbox";

const FALLBACK_IMAGE = "/assets/exercise-image-placeholder.svg";

export function ExerciseImagePreview({ src, alt, priority = false }: { readonly src: string; readonly alt: string; readonly priority?: boolean }) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [fallback, setFallback] = useState(false);

  return <ImageLightbox alt={alt} className="h-full w-full object-contain" containerClassName="absolute inset-0" loading={priority ? "eager" : "lazy"} onError={() => { if (!fallback) { setFallback(true); setCurrentSrc(FALLBACK_IMAGE); } }} src={currentSrc} />;
}
