"use client";

import Image from "next/image";
import { useState } from "react";

const FALLBACK_IMAGE = "/assets/exercise-image-placeholder.svg";

export function ExerciseImagePreview({ src, alt, priority = false }: { readonly src: string; readonly alt: string; readonly priority?: boolean }) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [fallback, setFallback] = useState(false);

  return <Image
    alt={alt}
    className="object-contain"
    fill
    loading={priority ? "eager" : "lazy"}
    onError={() => {
      if (!fallback) {
        setFallback(true);
        setCurrentSrc(FALLBACK_IMAGE);
      }
    }}
    sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
    src={currentSrc}
    unoptimized
  />;
}
