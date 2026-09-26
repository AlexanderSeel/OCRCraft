"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { buttonClass } from "@/components/ui/form";

function youtubeEmbedUrl(value: string): string | null {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    let id: string | null = null;
    if (host === "youtu.be") id = url.pathname.split("/").filter(Boolean)[0] ?? null;
    if (host.endsWith("youtube.com")) {
      if (url.pathname === "/watch") id = url.searchParams.get("v");
      else if (url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/embed/")) {
        id = url.pathname.split("/").filter(Boolean)[1] ?? null;
      }
    }
    return id && /^[A-Za-z0-9_-]{6,20}$/.test(id)
      ? "https://www.youtube-nocookie.com/embed/" + id
      : null;
  } catch {
    return null;
  }
}

export function VideoPopoverButton({
  title,
  videoUrl,
  thumbnailUrl,
}: {
  readonly title: string;
  readonly videoUrl: string;
  readonly thumbnailUrl?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const embedUrl = youtubeEmbedUrl(videoUrl);
  return (
    <>
      <button
        className={buttonClass("secondary", "min-h-10 px-3 py-2 text-xs")}
        onClick={() => setOpen(true)}
        type="button"
      >
        Video abspielen
      </button>
      {open ? (
        <Dialog eyebrow="Video" onClose={() => setOpen(false)} title={title}>
          <div className="overflow-hidden rounded-xl bg-black">
            {embedUrl ? (
              <iframe
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="aspect-video w-full"
                referrerPolicy="strict-origin-when-cross-origin"
                src={embedUrl}
                title={title}
              />
            ) : (
              <video
                className="max-h-[70vh] w-full"
                controls
                playsInline
                poster={thumbnailUrl ?? undefined}
                preload="metadata"
                src={videoUrl}
              >
                Dein Browser kann dieses Video nicht direkt wiedergeben.
              </video>
            )}
          </div>
          <div className="mt-3 flex justify-end">
            <a className={buttonClass("secondary", "min-h-10 px-3 py-2 text-xs")} href={videoUrl} rel="noreferrer" target="_blank">
              Video in neuem Tab öffnen
            </a>
          </div>
        </Dialog>
      ) : null}
    </>
  );
}
