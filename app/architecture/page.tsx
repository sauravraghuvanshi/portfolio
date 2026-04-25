import type { Metadata } from "next";
import { BreadcrumbListSchema } from "@/components/JsonLd";
import ArchitectureDiagram from "@/components/sections/ArchitectureDiagram";

export const metadata: Metadata = {
  title: "Azure Architecture — Saurav Raghuvanshi",
  description:
    "This portfolio runs on Azure App Service, AI Foundry, Blob Storage, and Application Insights. A transparent look at the cloud infrastructure, CI/CD pipeline, and AI architecture powering this site.",
  alternates: { canonical: "/architecture" },
  openGraph: {
    type: "website",
    url: "/architecture",
    title: "Built on Azure — Portfolio Architecture — Saurav Raghuvanshi",
    description:
      "Azure App Service · AI Foundry RAG chatbot · Blob Storage · Application Insights · GitHub Actions CI/CD. A cloud architect's own infrastructure, fully documented.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Saurav Raghuvanshi — Azure Architecture",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Built on Azure — Portfolio Architecture",
    description:
      "Azure App Service, AI Foundry RAG chatbot, Blob Storage, Application Insights, GitHub Actions CI/CD.",
    images: ["/og-image.png"],
  },
};

export default function ArchitecturePage() {
  return (
    <>
      <BreadcrumbListSchema
        items={[
          { name: "Home", url: "/" },
          { name: "Architecture", url: "/architecture" },
        ]}
      />
      <ArchitectureDiagram />
    </>
  );
}
