import { getProfile, getAllCaseStudies, getCertifications } from "@/lib/content";
import { SITE_URL } from "@/lib/constants";

export function PersonSchema() {
  const profile = getProfile();
  const certifications = getCertifications();

  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: profile.name,
    jobTitle: profile.title,
    description: profile.summary,
    url: SITE_URL,
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
    hasCredential: certifications.map(
      (cert) => ({
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
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: "Saurav Raghuvanshi — Digital Cloud Solution Architect @ Microsoft",
    description:
      "Portfolio and case studies of Saurav Raghuvanshi, Digital Cloud Solution Architect at Microsoft",
    publisher: {
      "@id": `${SITE_URL}/#person`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/projects?q={search_term_string}`,
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

interface BlogPostSchemaProps {
  title: string;
  description: string;
  slug: string;
  tags: string[];
  datePublished: string;
  dateModified: string;
  coverImage?: string;
}

export function BlogPostSchema({ title, description, slug, tags, datePublished, dateModified, coverImage }: BlogPostSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${SITE_URL}/blog/${slug}`,
    headline: title,
    description,
    url: `${SITE_URL}/blog/${slug}`,
    keywords: tags.join(", "),
    datePublished,
    dateModified,
    ...(coverImage ? { image: coverImage } : {}),
    author: { "@id": `${SITE_URL}/#person` },
    publisher: { "@id": `${SITE_URL}/#person` },
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
    "@id": `${SITE_URL}/case-studies/${slug}`,
    name: title,
    description,
    url: `${SITE_URL}/case-studies/${slug}`,
    keywords: tags.join(", "),
    datePublished: datePublished || "2024-01-01",
    author: {
      "@id": `${SITE_URL}/#person`,
    },
    publisher: {
      "@id": `${SITE_URL}/#person`,
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
