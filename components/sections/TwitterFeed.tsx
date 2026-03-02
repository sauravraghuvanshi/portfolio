"use client";

import Script from "next/script";
import { useRef } from "react";

declare global {
  interface Window {
    twttr?: { widgets: { load: (el?: HTMLElement | null) => void } };
  }
}

export default function TwitterFeed() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="w-full min-h-[300px]">
      <a
        className="twitter-timeline"
        data-tweet-limit="5"
        data-chrome="noheader nofooter noborders transparent"
        data-dnt="true"
        href="https://twitter.com/Saurav_Raghu"
      >
        Loading tweets…
      </a>
      <Script
        src="https://platform.twitter.com/widgets.js"
        strategy="afterInteractive"
        onLoad={() => window.twttr?.widgets.load(containerRef.current)}
      />
    </div>
  );
}
