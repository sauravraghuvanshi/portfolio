"use client";

import { useState } from "react";
import Image from "next/image";

interface YouTubeEmbedProps {
  videoId: string;
  title: string;
  width?: string;
  priority?: boolean;
}

export default function YouTubeEmbed({ videoId, title, width = "100%", priority = false }: YouTubeEmbedProps) {
  const [playing, setPlaying] = useState(false);
  const [thumbSrc, setThumbSrc] = useState(
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
  );

  const hasCustomWidth = width && width !== "100%";
  const wrapper = (children: React.ReactNode) =>
    hasCustomWidth ? (
      <div style={{ maxWidth: width, margin: "0 auto" }}>{children}</div>
    ) : (
      <>{children}</>
    );

  if (playing) {
    return wrapper(
      <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  return wrapper(
    <button
      onClick={() => setPlaying(true)}
      className="relative aspect-video w-full group overflow-hidden rounded-xl bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      aria-label={`Play: ${title}`}
    >
      <Image
        src={thumbSrc}
        alt={title}
        fill
        priority={priority}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        onError={() => setThumbSrc(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`)}
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition-colors duration-300" />
      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-14 h-14 rounded-full bg-white/90 group-hover:bg-white group-hover:scale-110 transition-all duration-300 flex items-center justify-center shadow-lg">
          <svg
            className="w-5 h-5 text-slate-900 ml-0.5"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </button>
  );
}