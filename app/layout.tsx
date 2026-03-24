import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import LayoutShell from "@/components/layout/LayoutShell";
import { PersonSchema, WebSiteSchema } from "@/components/JsonLd";
import { SITE_URL } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Saurav Raghuvanshi — Digital Cloud Solution Architect @ Microsoft",
    template: "%s | Saurav Raghuvanshi",
  },
  description:
    "Digital Cloud Solution Architect at Microsoft helping high-growth startups and unicorns build AI-powered, cloud-native platforms at scale. Azure · Generative AI · Cloud-Native.",
  keywords: [
    "Digital Cloud Solution Architect",
    "Microsoft Azure",
    "Generative AI",
    "Cloud-Native",
    "Agentic AI",
    "AI Foundry",
    "Azure Architecture",
    "Startup Cloud Platform",
    "DevOps",
    "Platform Engineering",
  ],
  authors: [{ name: "Saurav Raghuvanshi" }],
  creator: "Saurav Raghuvanshi",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Saurav Raghuvanshi — Digital Cloud Solution Architect @ Microsoft",
    title: "Saurav Raghuvanshi — Digital Cloud Solution Architect @ Microsoft",
    description:
      "Digital Cloud Solution Architect at Microsoft. Helping high-growth startups and unicorns build AI-powered, cloud-native platforms at scale.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Saurav Raghuvanshi — Digital Cloud Solution Architect @ Microsoft",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Saurav Raghuvanshi — Digital Cloud Solution Architect @ Microsoft",
    description:
      "Digital Cloud Solution Architect at Microsoft. Helping high-growth startups and unicorns build AI-powered, cloud-native platforms at scale.",
    creator: "@sraghuvanshi",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1e" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="alternate" type="application/rss+xml" title="Blog RSS Feed" href="/feed.xml" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = localStorage.getItem('theme');
                var preferred = theme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                document.documentElement.classList.toggle('dark', preferred === 'dark');
              })();
            `,
          }}
        />
        <PersonSchema />
        <WebSiteSchema />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <LayoutShell
          navigation={<Navigation />}
          footer={<Footer />}
        >
          {children}
        </LayoutShell>
      </body>
    </html>
  );
}
