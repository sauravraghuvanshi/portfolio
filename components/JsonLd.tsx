import { getProfile, getAllCaseStudies } from "@/lib/content";

export function PersonSchema() {
  const profile = getProfile();

  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": "https://sauravraghuvanshi.dev/#person",
    name: profile.name,
    jobTitle: profile.title,
    description: profile.summary,
    url: "https://sauravraghuvanshi.dev",
    email: "sauravraghuvanshi24@gmail.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Bengaluru",
      addressRegion: "Karnataka",
      addressCountry: "IN",
    },
    sameAs: [
      profile.social.linkedin,
      profile.social.github,
      profile.social.twitter,
    ],
    knowsAbout: [
      "Cloud Architecture",
      "Microsoft Azure",
      "Generative AI",
      "Agentic AI",
      "Azure AI Foundry",
      "Cloud-Native Architecture",
      "DevOps",
      "Kubernetes",
      "Terraform",
      "Platform Engineering",
      "Startup Scaling",
    ],
    hasCredential: profile.certifications.map(
      (cert: { name: string; issuer: string; year: number }) => ({
        "@type": "EducationalOccupationalCredential",
        name: cert.name,
        recognizedBy: { "@type": "Organization", name: cert.issuer },
        dateCreated: cert.year.toString(),
      })
    ),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function WebSiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://sauravraghuvanshi.dev/#website",
    url: "https://sauravraghuvanshi.dev",
    name: "Saurav Raghuvanshi — Digital Cloud Solution Architect @ Microsoft",
    description:
      "Portfolio and case studies of Saurav Raghuvanshi, Digital Cloud Solution Architect at Microsoft",
    publisher: {
      "@id": "https://sauravraghuvanshi.dev/#person",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://sauravraghuvanshi.dev/projects?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface CaseStudySchemaProps {
  title: string;
  description: string;
  slug: string;
  tags: string[];
  datePublished?: string;
}

export function CaseStudySchema({ title, description, slug, tags, datePublished }: CaseStudySchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `https://sauravraghuvanshi.dev/case-studies/${slug}`,
    name: title,
    description,
    url: `https://sauravraghuvanshi.dev/case-studies/${slug}`,
    keywords: tags.join(", "),
    datePublished: datePublished || "2024-01-01",
    author: {
      "@id": "https://sauravraghuvanshi.dev/#person",
    },
    publisher: {
      "@id": "https://sauravraghuvanshi.dev/#person",
    },
    about: {
      "@type": "Thing",
      name: "Cloud Architecture",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
