"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Fires a first-party page-view beacon on every client-side navigation.
 *
 * This lives on the client because public pages are ISR (`revalidate = 60`) —
 * a server component runs once per regeneration, not once per visit, so it
 * cannot count anything meaningful. See `lib/analytics-store.ts` for the full
 * reasoning.
 *
 * Same-path repeats are ignored for the lifetime of the page session so a
 * refresh loop, a `router.refresh()`, or React StrictMode's double-invoked
 * effects in dev cannot inflate the numbers.
 */
export default function PageViewTracker() {
  const pathname = usePathname();
  const sent = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/admin")) return;
    if (sent.current.has(pathname)) return;
    sent.current.add(pathname);

    const payload = JSON.stringify({
      path: pathname,
      referrer: document.referrer || undefined,
    });

    try {
      // `sendBeacon` survives the page being unloaded mid-flight, which a plain
      // fetch does not. It is unavailable in a few browsers, hence the fallback.
      const blob = new Blob([payload], { type: "application/json" });
      if (navigator.sendBeacon?.("/api/pageview", blob)) return;
    } catch {
      // fall through
    }

    void fetch("/api/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Analytics must never surface an error to the reader.
    });
  }, [pathname]);

  return null;
}
