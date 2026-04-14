"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { initAppInsights, trackPageView } from "@/lib/appinsights";

export default function AppInsightsProvider() {
  const pathname = usePathname();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initAppInsights();
      initialized.current = true;
    }
  }, []);

  useEffect(() => {
    if (initialized.current) {
      trackPageView(document.title, pathname);
    }
  }, [pathname]);

  return null;
}
