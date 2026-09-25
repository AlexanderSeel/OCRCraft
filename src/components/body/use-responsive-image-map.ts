"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";
import { MUSCLE_MAP_REFERENCE_SIZE } from "@/data/muscle-map-regions";

export interface ImageMapScale {
  readonly scaleX: number;
  readonly scaleY: number;
}

export function useResponsiveImageMap(imageRef: RefObject<HTMLImageElement | null>): ImageMapScale {
  const [scale, setScale] = useState<ImageMapScale>({ scaleX: 1, scaleY: 1 });

  const measure = useCallback(() => {
    const image = imageRef.current;
    if (!image) return;
    const rect = image.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    setScale({
      scaleX: rect.width / MUSCLE_MAP_REFERENCE_SIZE.width,
      scaleY: rect.height / MUSCLE_MAP_REFERENCE_SIZE.height,
    });
  }, [imageRef]);

  useEffect(() => {
    const image = imageRef.current;
    if (!image) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(image);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [imageRef, measure]);

  return scale;
}
