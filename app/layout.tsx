import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import LayoutShell from "@/components/layout/LayoutShell";
import CommandPalette from "@/components/ui/CommandPalette";
import type { SearchItem } from "@/components/ui/CommandPalette";
import { PersonSchema, WebSiteSchema } from "@/components/JsonLd";
import { SITE_URL } from "@/lib/constants";
import { getAllBlogPosts, getAllCaseStudies, getProjects, getTalks, getEvents, getProfile } from "@/lib/content";
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
  // Build lightweight search index for command palette
  const searchIndex: SearchItem[] = [
    ...getAllBlogPosts().map((p) => ({
      title: p.title,
      description: p.description,
      url: `/blog/${p.slug}`,
      type: "blog" as const,
    })),
    ...getAllCaseStudies().map((cs) => ({
      title: cs.title,
      description: cs.subtitle,
      url: `/case-studies/${cs.slug}`,
      type: "case-study" as const,
    })),
    ...getProjects().map((p) => ({
      title: p.title,
      description: p.description,
      url: `/projects`,
      type: "project" as const,
    })),
    ...getTalks().map((t) => ({
      title: t.title,
      description: t.description || t.topic,
      url: `/talks`,
      type: "talk" as const,
    })),
    ...getEvents().map((e) => ({
      title: e.title,
      description: e.summary?.slice(0, 100),
      url: `/events/${e.slug}`,
      type: "event" as const,
    })),
  ];

  const profile = getProfile();
  const socialLinks = {
    linkedin: profile.social?.linkedin ?? "",
    github: profile.social?.github ?? "",
    twitter: profile.social?.twitter ?? "",
    calendly: profile.social?.calendly ?? "",
  };

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
        <CommandPalette searchIndex={searchIndex} socialLinks={socialLinks} />
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
