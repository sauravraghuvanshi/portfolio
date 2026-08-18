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
  // NEXT_PUBLIC_* vars are inlined by the bundler ONLY at STATIC reference sites
  // like `process.env.NEXT_PUBLIC_BUILD_COMMIT`. The present() helper reads
  // `process.env[key]` with a computed key, which the bundler never rewrites — so
  // at App Service runtime those reads hit the real container env, where the build
  // vars don't exist (they live only in the Actions runner at build time). Read
  // the build-provenance values here via static access so CI's stamp is baked into
  // the bundle, then feed the resulting presence into the CI/CD card explicitly.
  // This is why the GitHub card can't use envKeysFor([...]) like runtime-env
  // services do — that path always rendered ✗ on a pipeline that clearly works.
  const buildCommit = process.env.NEXT_PUBLIC_BUILD_COMMIT ?? "";
  const buildBranch = process.env.NEXT_PUBLIC_BUILD_BRANCH ?? "";

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
      endpoint: process.env.AZURE_FOUNDRY_PROJECT_ENDPOINT ?? null,
      notes:
        "Powers the RAG chatbot and AI Writer. Application-scoped Responses API; stateless mode.",
      // Only the two vars the Foundry code actually throws without (see
      // lib/ai/foundry-agent.ts + rag-pipeline.ts). The old list named
      // AZURE_FOUNDRY_ENDPOINT — a var that was never set, because every caller
      // reads AZURE_FOUNDRY_PROJECT_ENDPOINT — plus AI_WRITER_AGENT_NAME (an
      // optional override that falls back to AZURE_FOUNDRY_AGENT_NAME) and
      // AZURE_FOUNDRY_API_KEY (never read anywhere; prod authenticates with a
      // managed identity). Listing those as required is what produced the
      // "OPERATIONAL yet endpoint ✗" contradiction and the misleading 9/17.
      envKeys: envKeysFor([
        "AZURE_FOUNDRY_PROJECT_ENDPOINT",
        "AZURE_FOUNDRY_AGENT_NAME",
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
      // The public container URL is inlined at build (deploy.yml); it's a real,
      // clickable endpoint. The old code built the URL from AZURE_STORAGE_ACCOUNT_NAME
      // — a var nothing sets — so the endpoint link was always null.
      endpoint: process.env.NEXT_PUBLIC_AZURE_STORAGE_URL ?? null,
      notes: "Hosts uploaded media (cover images, AI-generated images).",
      // The vars the storage code actually depends on: azure-storage.ts throws
      // without AZURE_STORAGE_CONNECTION_STRING (a server secret), and uploaded
      // images only render because NEXT_PUBLIC_AZURE_STORAGE_URL is inlined at
      // build. The old list named AZURE_STORAGE_ACCOUNT_NAME + AZURE_STORAGE_CONTAINER
      // — neither is read anywhere (the real container var is
      // AZURE_STORAGE_CONTAINER_NAME, and it's optional with a "blog-images"
      // fallback). Listing the phantoms is what showed two ✗ on an operational
      // service.
      envKeys: envKeysFor([
        "AZURE_STORAGE_CONNECTION_STRING",
        "NEXT_PUBLIC_AZURE_STORAGE_URL",
      ]),
      color: "#06b6d4",
      status: "operational",
    },
    {
      id: "analytics",
      name: "First-party Analytics",
      category: "monitoring",
      tier: "Persistent volume · privacy-preserving",
      // Honest reframe. The Application Insights web SDK is bundled but DORMANT:
      // NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING was never set on the App Service,
      // so initAppInsights() no-ops and zero telemetry was ever collected (see the
      // header comment in lib/analytics-store.ts). The page-view telemetry that
      // actually runs is first-party — a cookie-less, salted-hash counter on the
      // persistent volume. Its Azure code path is gated on WEBSITE_SITE_NAME
      // (Azure-injected), so that var's presence is the real "this is live" signal.
      // The card used to check the App Insights connection string and claim
      // "operational", which is the ✗-on-an-operational-service contradiction.
      notes:
        "First-party page-view counter on the persistent volume (no cookies, no third party). The Application Insights SDK is bundled but dormant — its connection string was never set.",
      envKeys: envKeysFor(["WEBSITE_SITE_NAME"]),
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
      // NEXT_PUBLIC_BUILD_* are build-time inlined and never present in the runtime
      // process.env, so the dynamic present() helper always reported ✗ here even
      // though CI stamped the bundle. Derive presence from the values captured via
      // static access at the top of this function instead.
      envKeys: [
        { key: "NEXT_PUBLIC_BUILD_COMMIT", present: buildCommit.length > 0 },
        { key: "NEXT_PUBLIC_BUILD_BRANCH", present: buildBranch.length > 0 },
      ],
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
      // Build provenance comes from the NEXT_PUBLIC_BUILD_* values captured via
      // static access above (inlined by CI at build); fall back to the raw runner
      // vars for a local `next build`, then to sane defaults for `next dev`.
      commit: (buildCommit || process.env.GITHUB_SHA || "").slice(0, 7) || "local",
      branch: buildBranch || process.env.GITHUB_REF_NAME || "main",
      builtAt:
        process.env.NEXT_PUBLIC_BUILD_TIME ||
        process.env.BUILD_TIME ||
        new Date().toISOString(),
      environment: process.env.NODE_ENV ?? "development",
    },
    services,
    techStack,
    pipeline,
    envCoverage,
  };
}
