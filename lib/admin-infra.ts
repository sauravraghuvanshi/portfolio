import "server-only";

export interface InfraService {
  id: string;
  name: string;
  category: "compute" | "ai" | "storage" | "monitoring" | "cicd" | "auth" | "email";
  status: "operational" | "configured" | "missing";
  region?: string;
  tier?: string;
  endpoint?: string | null;
  notes: string;
  envKeys: { key: string; present: boolean }[];
  /** SVG-friendly accent for the card */
  color: string;
}

export interface InfraMetrics {
  buildInfo: {
    nodeVersion: string;
    nextVersion: string;
    commit: string;
    branch: string;
    builtAt: string;
    environment: string;
  };
  services: InfraService[];
  techStack: { name: string; version?: string; role: string }[];
  pipeline: { id: string; label: string; status: "ok" | "warn" | "error"; detail: string }[];
  envCoverage: { configured: number; total: number };
}

function present(key: string): boolean {
  const v = process.env[key];
  return Boolean(v && v.length > 0);
}

function envKeysFor(keys: string[]): { key: string; present: boolean }[] {
  return keys.map((key) => ({ key, present: present(key) }));
}

let cachedNextVersion: string | null = null;
function readNextVersion(): string {
  if (cachedNextVersion !== null) return cachedNextVersion;
  try {
    // dynamic require avoids bundling
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pkg = require("next/package.json") as { version: string };
    cachedNextVersion = pkg.version;
  } catch {
    cachedNextVersion = "unknown";
  }
  return cachedNextVersion;
}

export function getInfraMetrics(): InfraMetrics {
  const services: InfraService[] = [
    {
      id: "appservice",
      name: "Azure App Service",
      category: "compute",
      region: process.env.WEBSITE_REGION ?? "Central India",
      tier: process.env.WEBSITE_SKU ?? process.env.APP_SERVICE_TIER ?? "B1",
      endpoint:
        process.env.WEBSITE_HOSTNAME
          ? `https://${process.env.WEBSITE_HOSTNAME}`
          : "https://saurav-portfolio.azurewebsites.net",
      notes: "Standalone Next.js 16 deployment via Kudu zip deploy.",
      envKeys: envKeysFor(["WEBSITE_HOSTNAME", "WEBSITE_INSTANCE_ID"]),
      color: "#0078d4",
      status: "operational",
    },
    {
      id: "foundry",
      name: "Azure AI Foundry",
      category: "ai",
      region: process.env.AZURE_FOUNDRY_REGION ?? "East US 2",
      tier: "gpt-5.4 · gpt-4o · MCP enabled",
      endpoint: process.env.AZURE_FOUNDRY_ENDPOINT ?? null,
      notes:
        "Powers the RAG chatbot and AI Writer. Application-scoped Responses API; stateless mode.",
      envKeys: envKeysFor([
        "AZURE_FOUNDRY_ENDPOINT",
        "AZURE_FOUNDRY_AGENT_NAME",
        "AI_WRITER_AGENT_NAME",
        "AZURE_FOUNDRY_API_KEY",
      ]),
      color: "#7e57c2",
      status: "operational",
    },
    {
      id: "imagegen",
      name: "Azure OpenAI · Image",
      category: "ai",
      region: process.env.AZURE_OPENAI_IMAGE_REGION ?? "East US 2",
      tier: process.env.AZURE_OPENAI_IMAGE_DEPLOYMENT ?? "gpt-image-2-1",
      endpoint: process.env.AZURE_OPENAI_IMAGE_ENDPOINT ?? null,
      notes: "Cover image + inline image generation for AI Writer drafts.",
      envKeys: envKeysFor([
        "AZURE_OPENAI_IMAGE_ENDPOINT",
        "AZURE_OPENAI_IMAGE_API_KEY",
        "AZURE_OPENAI_IMAGE_DEPLOYMENT",
      ]),
      color: "#ec4899",
      status: "operational",
    },
    {
      id: "blob",
      name: "Azure Blob Storage",
      category: "storage",
      region: "Central India",
      tier: "Hot · LRS",
      endpoint: process.env.AZURE_STORAGE_ACCOUNT_NAME
        ? `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net`
        : null,
      notes: "Hosts uploaded media (cover images, AI-generated images).",
      envKeys: envKeysFor([
        "AZURE_STORAGE_ACCOUNT_NAME",
        "AZURE_STORAGE_CONTAINER",
      ]),
      color: "#06b6d4",
      status: "operational",
    },
    {
      id: "appinsights",
      name: "Application Insights",
      category: "monitoring",
      tier: "Web · Workspace-based",
      notes: "Client-side telemetry (page views, perf, exceptions).",
      envKeys: envKeysFor([
        "NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING",
      ]),
      color: "#0ea5e9",
      status: "operational",
    },
    {
      id: "github",
      name: "GitHub Actions CI/CD",
      category: "cicd",
      tier: "Build · Test · Zipdeploy",
      endpoint: "https://github.com/sauravraghuvanshi/portfolio/actions",
      notes:
        "Runs lint, build, then publishes a standalone zip and verifies the live site.",
      envKeys: envKeysFor(["GITHUB_SHA", "GITHUB_REF_NAME"]),
      color: "#24292f",
      status: "operational",
    },
    {
      id: "auth",
      name: "NextAuth v5",
      category: "auth",
      tier: "Credentials · JWT sessions",
      notes:
        "Single-user admin (env-based credentials). Brute-force protection + middleware guards.",
      envKeys: envKeysFor([
        "AUTH_SECRET",
        "ADMIN_USERNAME",
        "ADMIN_PASSWORD",
      ]),
      color: "#10b981",
      status: "operational",
    },
  ];

  const techStack: InfraMetrics["techStack"] = [
    { name: "Next.js", version: readNextVersion(), role: "App Router · React 19 · standalone build" },
    { name: "TypeScript", role: "Strict mode" },
    { name: "Tailwind CSS", version: "v4", role: "CSS-first design tokens" },
    { name: "Framer Motion", version: "12", role: "All admin and marketing animations" },
    { name: "Recharts", version: "3.8", role: "Admin dashboard charts" },
    { name: "AI SDK", version: "v6", role: "Streaming chatbot + AI Writer" },
    { name: "NextAuth", version: "v5", role: "Admin authentication" },
    { name: "Lucide", role: "Icon system" },
  ];

  const pipeline: InfraMetrics["pipeline"] = [
    { id: "lint", label: "Lint", status: "ok", detail: "ESLint 9 + Next core-web-vitals" },
    { id: "test", label: "Playwright E2E", status: "ok", detail: "4 suites against the live build" },
    { id: "build", label: "Standalone build", status: "ok", detail: "Optimized ~30 MB artifact" },
    { id: "verify", label: "Live verify", status: "ok", detail: "curl + content assertions post-deploy" },
  ];

  const allEnvKeys = services.flatMap((s) => s.envKeys);
  const envCoverage = {
    configured: allEnvKeys.filter((k) => k.present).length,
    total: allEnvKeys.length,
  };

  return {
    buildInfo: {
      nodeVersion: process.version,
      nextVersion: readNextVersion(),
      commit: (process.env.GITHUB_SHA ?? "").slice(0, 7) || "local",
      branch: process.env.GITHUB_REF_NAME ?? "main",
      builtAt: process.env.BUILD_TIME ?? new Date().toISOString(),
      environment: process.env.NODE_ENV ?? "development",
    },
    services,
    techStack,
    pipeline,
    envCoverage,
  };
}
