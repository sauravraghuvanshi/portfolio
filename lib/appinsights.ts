"use client";

import { ApplicationInsights } from "@microsoft/applicationinsights-web";

let appInsights: ApplicationInsights | null = null;

export function initAppInsights() {
  if (typeof window === "undefined") return;
  if (appInsights) return;

  const connectionString = process.env.NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING;
  if (!connectionString) return;

  appInsights = new ApplicationInsights({
    config: {
      connectionString,
      enableAutoRouteTracking: false, // we handle route changes manually via usePathname
      disableFetchTracking: false,
      disableAjaxTracking: false,
      enableCorsCorrelation: true,
      enableRequestHeaderTracking: true,
      enableResponseHeaderTracking: true,
    },
  });

  appInsights.loadAppInsights();
}

export function trackPageView(name: string, uri: string) {
  appInsights?.trackPageView({ name, uri });
}

export function trackEvent(name: string, properties?: Record<string, string>) {
  appInsights?.trackEvent({ name }, properties);
}
