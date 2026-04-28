"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Server,
  Database,
  Sparkles,
  BarChart2,
  GitBranch,
  Shield,
  ArrowRight,
  ExternalLink,
  CheckCircle,
  ChevronRight,
  Globe,
  MessageSquare,
  Zap,
  Upload,
  Search,
  RefreshCw,
  DollarSign,
  Lock,
  Layers,
  PenLine,
} from "lucide-react";

// ─── types ────────────────────────────────────────────────────────────────────

type Color = "blue" | "purple" | "green" | "orange" | "slate";

interface ServiceDef {
  id: string;
  name: string;
  tier: string;
  region?: string;
  purpose: string;
  cost: string;
  details: string[];
  icon: React.ReactNode;
  color: Color;
  docsUrl?: string;
}

interface ServiceGroup {
  label: string;
  services: ServiceDef[];
}

// ─── full-string color maps (no dynamic interpolation — Tailwind safe) ────────

const palette: Record<
  Color,
  {
    card: string;
    active: string;
    icon: string;
    badge: string;
    panel: string;
    check: string;
    accentBorder: string;
    whyTag: string;
  }
> = {
  blue: {
    card: "border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600",
    active: "border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20 dark:ring-blue-400/20 border-l-4 border-l-blue-500 dark:border-l-blue-400",
    icon: "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400",
    badge: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300",
    panel: "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30",
    check: "text-blue-500 dark:text-blue-400",
    accentBorder: "border-l-4 border-l-blue-500 dark:border-l-blue-400",
    whyTag: "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  purple: {
    card: "border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600",
    active: "border-purple-500 dark:border-purple-400 ring-2 ring-purple-500/20 dark:ring-purple-400/20 border-l-4 border-l-purple-500 dark:border-l-purple-400",
    icon: "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400",
    badge: "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300",
    panel: "border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/30",
    check: "text-purple-500 dark:text-purple-400",
    accentBorder: "border-l-4 border-l-purple-500 dark:border-l-purple-400",
    whyTag: "bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  },
  green: {
    card: "border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600",
    active: "border-green-500 dark:border-green-400 ring-2 ring-green-500/20 dark:ring-green-400/20 border-l-4 border-l-green-500 dark:border-l-green-400",
    icon: "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400",
    badge: "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300",
    panel: "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/30",
    check: "text-green-500 dark:text-green-400",
    accentBorder: "border-l-4 border-l-green-500 dark:border-l-green-400",
    whyTag: "bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
  },
  orange: {
    card: "border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600",
    active: "border-orange-500 dark:border-orange-400 ring-2 ring-orange-500/20 dark:ring-orange-400/20 border-l-4 border-l-orange-500 dark:border-l-orange-400",
    icon: "bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400",
    badge: "bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300",
    panel: "border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/30",
    check: "text-orange-500 dark:text-orange-400",
    accentBorder: "border-l-4 border-l-orange-500 dark:border-l-orange-400",
    whyTag: "bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  },
  slate: {
    card: "border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500",
    active: "border-slate-500 dark:border-slate-400 ring-2 ring-slate-500/20 dark:ring-slate-400/20 border-l-4 border-l-slate-500 dark:border-l-slate-400",
    icon: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
    badge: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
    panel: "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30",
    check: "text-slate-500 dark:text-slate-400",
    accentBorder: "border-l-4 border-l-slate-500 dark:border-l-slate-400",
    whyTag: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  },
};

// ─── service data ─────────────────────────────────────────────────────────────

const serviceGroups: ServiceGroup[] = [
  {
    label: "Hosting & Delivery",
    services: [
      {
        id: "app-service",
        name: "Azure App Service",
        tier: "B1 · asp-saurav-portfolio · Linux · Node 20 LTS",
        region: "Central India",
        purpose:
          "Runs the Next.js 16 standalone server. Serves SSR pages, API routes, and static assets. Standalone build keeps the deploy zip at ~30 MB vs ~300 MB with full node_modules.",
        cost: "~$13 / month",
        details: [
          "output: standalone in next.config.ts — minimal self-contained build",
          "Startup: node server.js (no npm start needed)",
          "postbuild.mjs copies public/ + .next/static/ into .next/standalone/",
          "SCM basic auth enabled for Kudu zip-deploy (tenant policy override required)",
          "System-assigned Managed Identity for passwordless access to AI Foundry",
          "App settings: AUTH_SECRET, AZURE_OPENAI_*, AZURE_FOUNDRY_* (no AI key in prod)",
        ],
        icon: <Server size={20} />,
        color: "blue",
        docsUrl: "https://learn.microsoft.com/en-us/azure/app-service/",
      },
      {
        id: "blob-storage",
        name: "Azure Blob Storage",
        tier: "Standard LRS · Public Blob",
        region: "Central India",
        purpose:
          "Object storage for blog images and media files. Images uploaded via the admin panel land here and are served at public URLs embedded in MDX content.",
        cost: "~$0.01 / month",
        details: [
          "Account: sauravportfoliomedia (Standard_LRS · StorageV2)",
          "Container: blog-images (public blob access — serves media in MDX content)",
          "Container: portfolio-rag (public blob — RAG source files for AI vector store)",
          "Upload path: admin panel → POST /api/admin/upload → @azure/storage-blob",
          "Public URL: https://sauravportfoliomedia.blob.core.windows.net/blog-images/{file}",
          "No CDN — B1 tier portfolio; add Azure Front Door for production latency SLAs",
        ],
        icon: <Database size={20} />,
        color: "blue",
        docsUrl: "https://learn.microsoft.com/en-us/azure/storage/blobs/",
      },
    ],
  },
  {
    label: "Intelligence",
    services: [
      {
        id: "ai-foundry",
        name: "Azure AI Foundry",
        tier: "AIServices S0 · East US",
        region: "East US",
        purpose:
          "Hosts the AI agent powering the RAG chatbot and admin AI Writer. The agent uses file_search (vector store) for portfolio RAG grounding and Microsoft Learn MCP for Azure documentation.",
        cost: "Pay-per-token",
        details: [
          "Project: saurav-portfolio-ai-project (East US)",
          "Agent: saurav-portfolio-ai-project-agent",
          "Deployment: gpt-5.4-1 (model: gpt-5.4, 2026-03-05) — GlobalStandard, 1M TPM",
          "Deployment: gpt-4o (model: gpt-4o, 2024-08-06) — GlobalStandard, 10K TPM",
          "Embedding: text-embedding-3-small — Standard, 120K TPM (RAG vector store)",
          "Tools: file_search (RAG), web_search, microsoft_learn_mcp, code_interpreter",
          "RAG: vector store rebuilt via /api/admin/reindex, auto-triggered on content saves",
          "Streaming: project-scoped Responses API with SSE — true token-by-token output",
          "Auth: ManagedIdentityCredential in prod (scope: https://ai.azure.com/.default)",
        ],
        icon: <Sparkles size={20} />,
        color: "purple",
        docsUrl: "https://learn.microsoft.com/en-us/azure/ai-foundry/",
      },
      {
        id: "image-gen",
        name: "Azure OpenAI · Image Gen",
        tier: "gpt-image-2 · East US 2",
        region: "East US 2",
        purpose:
          "Generates cover images and inline visuals for AI Writer drafts. Integrated into the admin AI Writer flow — one click produces a contextually relevant cover image sized for OG and blog headers.",
        cost: "Pay-per-image",
        details: [
          "Model: gpt-image-2 · Deployment: gpt-image-2-1 (East US 2)",
          "Endpoint: AZURE_OPENAI_IMAGE_ENDPOINT env var",
          "Used in: AI Writer → generate cover image button",
          "Output: 1792×1024 PNG uploaded to Azure Blob Storage (blog-images container)",
          "Auth: API key (separate from Foundry — different endpoint)",
          "Rate: images generated on demand, not in a batch pipeline",
        ],
        icon: <Upload size={20} />,
        color: "orange",
        docsUrl: "https://learn.microsoft.com/en-us/azure/ai-services/openai/dall-e-quickstart",
      },
      {
        id: "app-insights",
        name: "Application Insights",
        tier: "Client-side SDK · Free tier",
        purpose:
          "Monitors client-side performance, page views, and JavaScript errors. Loaded non-blocking after hydration so it never slows down the initial render.",
        cost: "$0 / month",
        details: [
          "SDK: @microsoft/applicationinsights-web (browser-only, no server SDK)",
          "Captures: page views, performance marks, client-side exceptions",
          "Initialized via NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING",
          "Loaded as last child in app/layout.tsx — non-blocking",
          "Free tier covers up to 5 GB/day ingestion — more than sufficient for a portfolio",
        ],
        icon: <BarChart2 size={20} />,
        color: "orange",
        docsUrl:
          "https://learn.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview",
      },
    ],
  },
  {
    label: "DevOps & Security",
    services: [
      {
        id: "github-actions",
        name: "GitHub Actions",
        tier: "Free · ubuntu-latest",
        purpose:
          "Fully automated CI/CD. Every push to main triggers a build, zip, and deploy to Azure — no manual steps. Includes a post-deploy smoke test to catch broken routes before moving on.",
        cost: "$0 / month",
        details: [
          "Trigger: push to main branch → .github/workflows/deploy.yml",
          "Steps: npm ci → NEXT_TURBOPACK=0 npm run build → zip .next/standalone/",
          "Deploy: curl POST to Kudu /api/zipdeploy with AZURE_DEPLOY_USER + PASSWORD",
          "SCM_DO_BUILD_DURING_DEPLOYMENT=false — deploys pre-built artifacts",
          "Post-deploy: npm run verify:live smoke-tests all 13 public routes",
          "Recovery: re-enable SCM basic auth via az rest if 401s appear after tenant policy resets",
        ],
        icon: <GitBranch size={20} />,
        color: "green",
        docsUrl: "https://docs.github.com/en/actions",
      },
      {
        id: "managed-identity",
        name: "Managed Identity",
        tier: "System-assigned · RBAC",
        purpose:
          "Enables passwordless auth from App Service to AI Foundry. Zero API keys in production environment variables for AI calls. Detected via WEBSITE_SITE_NAME (auto-set by App Service).",
        cost: "$0",
        details: [
          "Type: system-assigned (lifecycle tied to App Service)",
          "Principal ID: b35f1102-df4f-4192-8c6f-f2185576f2cf",
          "RBAC role 1: Cognitive Services User (AI API calls)",
          "RBAC role 2: Azure AI Developer (MCP On-Behalf-Of auth flow)",
          "RBAC role 3: AcrPush (scoped to AI Foundry account)",
          "Local fallback: AzureCliCredential (requires az login — not deployed to prod)",
          "Detection: if (process.env.WEBSITE_SITE_NAME) → ManagedIdentityCredential",
        ],
        icon: <Shield size={20} />,
        color: "slate",
        docsUrl:
          "https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/",
      },
    ],
  },
];

// ─── cost table data ──────────────────────────────────────────────────────────

const costRows = [
  { service: "Azure App Service (B1)", tier: "B1 · asp-saurav-portfolio", cost: "~$13.00" },
  { service: "Azure Blob Storage", tier: "Standard LRS, < 1 GB", cost: "~$0.01" },
  { service: "Azure AI Foundry", tier: "gpt-5.4 + gpt-4o, pay-per-token", cost: "Variable" },
  { service: "Azure OpenAI · Image Gen", tier: "gpt-image-2, pay-per-image", cost: "Variable" },
  { service: "Application Insights", tier: "Free (< 5 GB/day)", cost: "$0.00" },
  { service: "GitHub Actions", tier: "Free tier", cost: "$0.00" },
  { service: "Azure Managed Identity", tier: "Free", cost: "$0.00" },
];

// ─── architectural choices ────────────────────────────────────────────────────

const archChoices = [
  {
    title: "App Service over Container Apps",
    why: "Cost",
    whyColor: "green" as Color,
    icon: <DollarSign size={14} />,
    body: "Azure Container Apps has a minimum billing even at zero traffic. App Service B1 provides dedicated compute for ~$13/month with no cold-start penalty. For a portfolio with sporadic but real traffic, App Service wins on predictability. The trade-off: no auto-scaling — acceptable for this use case.",
  },
  {
    title: "Standalone build over source deploy",
    why: "Reliability",
    whyColor: "orange" as Color,
    icon: <Layers size={14} />,
    body: "Deploying pre-built artifacts via Kudu zipdeploy is faster (30 MB zip vs 300 MB with node_modules) and eliminates Oryx build failures. The CI runner and the target environment are both Linux, but Windows development creates ENOENT issues in Turbopack that Webpack avoids.",
  },
  {
    title: "Managed Identity over API keys",
    why: "Security",
    whyColor: "blue" as Color,
    icon: <Lock size={14} />,
    body: "No AI API key in environment variables. App Service's system-assigned identity authenticates directly with AI Foundry via AAD tokens (Cognitive Services User + Azure AI Developer roles). Rotating credentials is a non-event. This is how enterprise Azure workloads should be configured.",
  },
  {
    title: "Filesystem content over a database",
    why: "Simplicity",
    whyColor: "slate" as Color,
    icon: <Layers size={14} />,
    body: "Blog posts are MDX files. Projects, talks, and certifications are JSON. The admin CMS writes directly to the filesystem (persistent volume on App Service). No database, no migrations, no connection strings. Git is the version history. Perfectly suitable for a single-author portfolio.",
  },
];

// ─── animation helpers ────────────────────────────────────────────────────────

function fadeUpVariants(reduce: boolean) {
  return {
    hidden: { opacity: 0, y: reduce ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const },
    },
  };
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const staggerContainerFast = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

// ─── sub-components ───────────────────────────────────────────────────────────

function ServiceCard({
  service,
  isActive,
  onClick,
  reduce,
}: {
  service: ServiceDef;
  isActive: boolean;
  onClick: () => void;
  reduce: boolean;
}) {
  const c = palette[service.color];
  return (
    <motion.button
      onClick={onClick}
      className={[
        "w-full text-left p-5 rounded-xl border-2 bg-white dark:bg-slate-900 transition-all duration-200 cursor-pointer",
        isActive ? c.active : c.card,
      ].join(" ")}
      whileHover={reduce ? {} : { y: -2 }}
      transition={{ duration: 0.15 }}
      aria-expanded={isActive}
      aria-label={`${service.name} — ${isActive ? "collapse" : "expand"} details`}
    >
      <div className="flex items-start gap-4">
        <div className={`p-2.5 rounded-xl flex-shrink-0 ${c.icon}`}>
          {service.icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm leading-tight mb-1">
            {service.name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 truncate">
            {service.tier}
          </p>
          <span
            className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${c.badge}`}
          >
            {service.cost}
          </span>
        </div>
        <ChevronRight
          size={16}
          className={`mt-1 flex-shrink-0 text-slate-400 dark:text-slate-600 transition-transform duration-200 ${
            isActive ? "rotate-90" : ""
          }`}
        />
      </div>
    </motion.button>
  );
}

function ServiceDetail({ service }: { service: ServiceDef }) {
  const c = palette[service.color];
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      style={{ overflow: "hidden" }}
    >
      <div className={`rounded-xl border p-5 mt-3 ${c.panel}`}>
        <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
          {service.purpose}
        </p>
        <ul className="space-y-2 mb-4">
          {service.details.map((d, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle
                size={13}
                className={`mt-0.5 flex-shrink-0 ${c.check}`}
              />
              <span className="text-xs text-slate-600 dark:text-slate-400">{d}</span>
            </li>
          ))}
        </ul>
        {service.docsUrl && (
          <a
            href={service.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
          >
            <ExternalLink size={12} />
            Microsoft Learn docs
          </a>
        )}
      </div>
    </motion.div>
  );
}

interface FlowStepProps {
  icon: React.ReactNode;
  label: string;
  sub: string;
  step?: number;
  isLast?: boolean;
  reduce?: boolean;
}

function FlowStep({ icon, label, sub, step, isLast, reduce }: FlowStepProps) {
  return (
    <motion.div
      variants={
        reduce
          ? {}
          : {
              hidden: { opacity: 0, x: -8 },
              visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
            }
      }
      className="flex items-center gap-2"
    >
      <div className="flex flex-col items-center text-center min-w-[80px]">
        <div className="relative w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-2">
          {icon}
          {step !== undefined && (
            <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-brand-600 dark:bg-brand-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
              {step}
            </span>
          )}
        </div>
        <span className="text-xs font-medium text-slate-900 dark:text-white leading-tight">
          {label}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sub}</span>
      </div>
      {!isLast && (
        <ArrowRight
          size={14}
          className="flex-shrink-0 text-slate-300 dark:text-slate-600"
        />
      )}
    </motion.div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function ArchitectureDiagram() {
  const reduce = useReducedMotion() ?? false;
  const [activeId, setActiveId] = useState<string | null>(null);

  const toggle = (id: string) =>
    setActiveId((prev) => (prev === id ? null : id));

  const itemVariants = fadeUpVariants(reduce);

  return (
    <main id="main-content">
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="pt-24 pb-20 section-padding bg-gradient-to-b from-brand-50 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="section-container">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* eyebrow */}
            <motion.p
              variants={itemVariants}
              className="text-brand-600 dark:text-brand-400 text-sm font-semibold tracking-widest uppercase mb-4"
            >
              Azure Infrastructure
            </motion.p>

            {/* h1 — Exaggerated Minimalism: oversized, bold, tight tracking */}
            <motion.h1
              variants={itemVariants}
              className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 dark:text-white mb-6 leading-[0.95]"
            >
              Built on{" "}
              <span className="text-brand-600 dark:text-brand-400">Azure</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mb-10 leading-relaxed"
            >
              This portfolio isn&rsquo;t just a website — it&rsquo;s a reference
              architecture. Every service, decision, and trade-off is documented
              below. Click any service to see its full configuration.
            </motion.p>

            {/* stat chips — stagger within stagger */}
            <motion.div
              variants={staggerContainerFast}
              className="flex flex-wrap gap-3"
            >
              {[
                { label: "7 Azure services", icon: <Zap size={14} /> },
                { label: "~$13 / month running cost", icon: <DollarSign size={14} /> },
                { label: "Managed Identity — zero API keys", icon: <Shield size={14} /> },
                { label: "~3 min deploy on git push", icon: <RefreshCw size={14} /> },
              ].map(({ label, icon }) => (
                <motion.span
                  key={label}
                  variants={itemVariants}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full shadow-sm"
                >
                  <span className="text-brand-500">{icon}</span>
                  {label}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── INFRASTRUCTURE MAP ────────────────────────────────────────────── */}
      <section className="py-16 section-padding bg-slate-50 dark:bg-slate-900/30">
        <div className="section-container">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="mb-10"
          >
            <motion.p
              variants={itemVariants}
              className="text-brand-600 dark:text-brand-400 text-sm font-semibold tracking-widest uppercase mb-2"
            >
              Infrastructure Map
            </motion.p>
            <motion.h2
              variants={itemVariants}
              className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2"
            >
              Azure Services
            </motion.h2>
            <motion.p variants={itemVariants} className="text-slate-600 dark:text-slate-400">
              Click any service to see configuration details and architectural rationale.
            </motion.p>
          </motion.div>

          <div className="space-y-8">
            {serviceGroups.map((group, gi) => (
              <motion.div
                key={group.label}
                initial={{ opacity: 0, y: reduce ? 0 : 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: gi * 0.1 }}
              >
                {/* group label with count */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {group.label}
                  </span>
                  <span className="text-xs font-mono text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    {group.services.length}
                  </span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                </div>

                {/* cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {group.services.map((svc) => (
                    <div key={svc.id}>
                      <ServiceCard
                        service={svc}
                        isActive={activeId === svc.id}
                        onClick={() => toggle(svc.id)}
                        reduce={reduce}
                      />
                      <AnimatePresence>
                        {activeId === svc.id && (
                          <ServiceDetail key={svc.id} service={svc} />
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REQUEST FLOWS ─────────────────────────────────────────────────── */}
      <section className="py-16 section-padding bg-white dark:bg-slate-950">
        <div className="section-container">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="mb-10"
          >
            <motion.p
              variants={itemVariants}
              className="text-brand-600 dark:text-brand-400 text-sm font-semibold tracking-widest uppercase mb-2"
            >
              Data Flows
            </motion.p>
            <motion.h2
              variants={itemVariants}
              className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2"
            >
              How Requests Flow
            </motion.h2>
            <motion.p variants={itemVariants} className="text-slate-600 dark:text-slate-400">
              Two distinct paths through the system — one for page rendering, one for AI chat.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Visitor request flow */}
            <motion.div
              initial={{ opacity: 0, y: reduce ? 0 : 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45 }}
              className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-5">
                <Globe size={16} className="text-brand-500" />
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                  Visitor Request Flow
                </h3>
              </div>
              <motion.div
                variants={staggerContainerFast}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="flex flex-wrap items-center gap-2"
              >
                <FlowStep icon={<Globe size={16} />} label="Browser" sub="HTTPS" step={1} reduce={reduce} />
                <FlowStep icon={<Server size={16} />} label="App Service" sub="Node 20" step={2} reduce={reduce} />
                <FlowStep icon={<Search size={16} />} label="Next.js SSR" sub="App Router" step={3} reduce={reduce} />
                <FlowStep icon={<Database size={16} />} label="JSON / MDX" sub="content/" step={4} reduce={reduce} />
                <FlowStep icon={<Globe size={16} />} label="HTML" sub="response" step={5} isLast reduce={reduce} />
              </motion.div>
              <p className="mt-5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Server components read JSON and MDX files at render time. No
                database queries — content is filesystem-based, fast and simple.
                Static pages are served directly; dynamic pages (blog slugs, project
                pages) render on-demand.
              </p>
            </motion.div>

            {/* AI chat flow */}
            <motion.div
              initial={{ opacity: 0, y: reduce ? 0 : 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: 0.07 }}
              className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-5">
                <Sparkles size={16} className="text-purple-500" />
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                  AI Chat Flow
                </h3>
              </div>
              <motion.div
                variants={staggerContainerFast}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="flex flex-wrap items-center gap-2"
              >
                <FlowStep icon={<MessageSquare size={16} />} label="User" sub="question" step={1} reduce={reduce} />
                <FlowStep icon={<Shield size={16} />} label="Rate limit" sub="/api/chat" step={2} reduce={reduce} />
                <FlowStep icon={<Sparkles size={16} />} label="AI Foundry" sub="agent" step={3} reduce={reduce} />
                <FlowStep icon={<Search size={16} />} label="RAG" sub="vector store" step={4} reduce={reduce} />
                <FlowStep icon={<Zap size={16} />} label="SSE stream" sub="typewriter" step={5} isLast reduce={reduce} />
              </motion.div>
              <p className="mt-5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                The Foundry Agent searches the portfolio vector store (built from
                all content via file_search) and Microsoft Learn for Azure docs.
                Responses stream as SSE tokens — the client renders them with a
                typewriter effect at ~170 chars/sec.
              </p>
            </motion.div>
          </div>

          {/* AI Writer flow — full width USP card */}
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, delay: 0.14 }}
            className="mt-8 bg-gradient-to-br from-purple-50/70 to-pink-50/70 dark:from-purple-950/30 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-1">
              <PenLine size={16} className="text-purple-500" />
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                AI Writer Flow
              </h3>
              <span className="ml-1 inline-flex items-center text-xs font-semibold bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-700">
                USP
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Admin-only — drafts complete blog posts and case studies end-to-end, then publishes with AI-generated cover images.
            </p>

            {/* Content generation branch */}
            <div className="mb-4">
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-3 block">
                Content generation
              </span>
              <motion.div
                variants={staggerContainerFast}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="flex flex-wrap items-center gap-2"
              >
                <FlowStep icon={<MessageSquare size={16} />} label="Topic prompt" sub="/admin/ai-writer" step={1} reduce={reduce} />
                <FlowStep icon={<Shield size={16} />} label="Auth + rate limit" sub="NextAuth · 3/min" step={2} reduce={reduce} />
                <FlowStep icon={<Sparkles size={16} />} label="Foundry Agent" sub="gpt-5.4 stream" step={3} reduce={reduce} />
                <FlowStep icon={<Zap size={16} />} label="SSE draft" sub="typewriter UI" step={4} reduce={reduce} />
                <FlowStep icon={<Search size={16} />} label="Edit + save" sub="MDX filesystem" step={5} reduce={reduce} />
                <FlowStep icon={<RefreshCw size={16} />} label="Reindex RAG" sub="vector store" step={6} isLast reduce={reduce} />
              </motion.div>
            </div>

            {/* Branch divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-purple-200 dark:bg-purple-800" />
              <span className="text-xs text-purple-500 dark:text-purple-400 font-medium whitespace-nowrap">
                + optional image generation branch
              </span>
              <div className="flex-1 h-px bg-purple-200 dark:bg-purple-800" />
            </div>

            {/* Image generation branch */}
            <div>
              <span className="text-xs font-medium text-pink-600 dark:text-pink-400 uppercase tracking-wider mb-3 block">
                Cover image (on demand)
              </span>
              <motion.div
                variants={staggerContainerFast}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="flex flex-wrap items-center gap-2"
              >
                <FlowStep icon={<Upload size={16} />} label="Generate cover" sub="one-click" step={1} reduce={reduce} />
                <FlowStep icon={<Sparkles size={16} />} label="gpt-image-2-1" sub="East US 2" step={2} reduce={reduce} />
                <FlowStep icon={<Database size={16} />} label="Blob Storage" sub="blog-images/" step={3} reduce={reduce} />
                <FlowStep icon={<Globe size={16} />} label="Public URL" sub="embedded in MDX" step={4} isLast reduce={reduce} />
              </motion.div>
            </div>

            <p className="mt-5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              The AI Writer calls the same Azure AI Foundry agent as the chatbot, but with a structured system prompt scoped to the selected content type (blog post, case study, etc.). Content streams token-by-token via AI SDK v6 SSE. The image branch calls a separate Azure OpenAI endpoint (deployment{" "}
              <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">gpt-image-2-1</code>
              , East US 2), uploads the PNG to Blob Storage, and injects the public URL into the draft — all in one click.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── CI/CD PIPELINE ────────────────────────────────────────────────── */}
      <section className="py-16 section-padding bg-slate-50 dark:bg-slate-900/30">
        <div className="section-container">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="mb-10"
          >
            <motion.p
              variants={itemVariants}
              className="text-brand-600 dark:text-brand-400 text-sm font-semibold tracking-widest uppercase mb-2"
            >
              Deployment
            </motion.p>
            <motion.h2
              variants={itemVariants}
              className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2"
            >
              CI/CD Pipeline
            </motion.h2>
            <motion.p variants={itemVariants} className="text-slate-600 dark:text-slate-400">
              From{" "}
              <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                git push
              </code>{" "}
              to live in roughly 3 minutes.
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6"
          >
            {/* desktop: horizontal staggered */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="hidden md:flex flex-wrap items-start gap-2"
            >
              <FlowStep icon={<GitBranch size={16} />} label="git push" sub="main branch" step={1} reduce={reduce} />
              <FlowStep icon={<RefreshCw size={16} />} label="Actions trigger" sub="ubuntu-latest" step={2} reduce={reduce} />
              <FlowStep icon={<Search size={16} />} label="npm ci + build" sub="standalone" step={3} reduce={reduce} />
              <FlowStep icon={<Upload size={16} />} label="zip deploy" sub="Kudu API" step={4} reduce={reduce} />
              <FlowStep icon={<Server size={16} />} label="App Service" sub="restarts" step={5} reduce={reduce} />
              <FlowStep icon={<Zap size={16} />} label="verify:live" sub="13 routes" step={6} isLast reduce={reduce} />
            </motion.div>

            {/* mobile: vertical staggered */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="md:hidden space-y-3"
            >
              {[
                { icon: <GitBranch size={16} />, label: "git push main", sub: "triggers deploy.yml", step: 1 },
                { icon: <RefreshCw size={16} />, label: "GitHub Actions", sub: "ubuntu-latest runner", step: 2 },
                { icon: <Search size={16} />, label: "npm ci + build", sub: "Next.js standalone output", step: 3 },
                { icon: <Upload size={16} />, label: "zip → Kudu zipdeploy", sub: "POST /api/zipdeploy", step: 4 },
                { icon: <Server size={16} />, label: "App Service restarts", sub: "node server.js", step: 5 },
                { icon: <Zap size={16} />, label: "verify:live", sub: "smoke-tests 13 routes", step: 6 },
              ].map(({ icon, label, sub, step }, i, arr) => (
                <motion.div
                  key={i}
                  variants={
                    reduce
                      ? {}
                      : {
                          hidden: { opacity: 0, x: -12 },
                          visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
                        }
                  }
                  className="flex items-center gap-3"
                >
                  <div className="flex flex-col items-center">
                    <div className="relative w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800 flex items-center justify-center text-brand-600 dark:text-brand-400">
                      {icon}
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-brand-600 dark:bg-brand-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                        {step}
                      </span>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mt-1" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">{label}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{sub}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                <strong className="text-slate-700 dark:text-slate-300">Key decision:</strong>{" "}
                <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">
                  SCM_DO_BUILD_DURING_DEPLOYMENT=false
                </code>{" "}
                — Azure receives pre-built artifacts, not source code. This avoids Oryx
                build failures on Windows-compiled modules and keeps deploy times
                consistent. The ~30 MB standalone zip deploys faster and more
                reliably than a full source + npm install cycle.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── COST BREAKDOWN ────────────────────────────────────────────────── */}
      <section className="py-16 section-padding bg-white dark:bg-slate-950">
        <div className="section-container">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="mb-10"
          >
            <motion.p
              variants={itemVariants}
              className="text-brand-600 dark:text-brand-400 text-sm font-semibold tracking-widest uppercase mb-2"
            >
              Cost
            </motion.p>
            <motion.h2
              variants={itemVariants}
              className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2"
            >
              Monthly Cost Breakdown
            </motion.h2>
            <motion.p variants={itemVariants} className="text-slate-600 dark:text-slate-400">
              Running a production-grade cloud architecture on Azure for almost nothing.
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45 }}
            className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">
                    Tier
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {costRows.map((row, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0, x: reduce ? 0 : -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.05, ease: "easeOut" as const }}
                    className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">
                      {row.service}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                      {row.tier}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-semibold text-slate-900 dark:text-white">
                      {row.cost}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-brand-50 dark:bg-brand-950/30 border-t-2 border-brand-200 dark:border-brand-800">
                  <td
                    colSpan={2}
                    className="px-6 py-4 font-semibold text-brand-800 dark:text-brand-200"
                  >
                    Total fixed cost / month
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-brand-700 dark:text-brand-300">
                    ~$13
                  </td>
                </tr>
              </tfoot>
            </table>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-4 text-xs text-slate-500 dark:text-slate-400"
          >
          AI token costs vary with chatbot usage. gpt-5.4 (primary) and gpt-4o
          (secondary) are used in the Foundry project; image generation uses gpt-image-2
          separately. App Service runs on a B1 plan (~$13/month); all other services are free tier or pay-per-use.
          </motion.p>
        </div>
      </section>

      {/* ── ARCHITECTURAL CHOICES ─────────────────────────────────────────── */}
      <section className="py-16 section-padding bg-slate-50 dark:bg-slate-900/30">
        <div className="section-container">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="mb-10"
          >
            <motion.p
              variants={itemVariants}
              className="text-brand-600 dark:text-brand-400 text-sm font-semibold tracking-widest uppercase mb-2"
            >
              Decisions
            </motion.p>
            <motion.h2
              variants={itemVariants}
              className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2"
            >
              Key Architectural Choices
            </motion.h2>
            <motion.p variants={itemVariants} className="text-slate-600 dark:text-slate-400">
              The intentional trade-offs behind this architecture.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {archChoices.map((card, i) => {
              const c = palette[card.whyColor];
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: reduce ? 0 : 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.45, delay: i * 0.07 }}
                  whileHover={reduce ? {} : { y: -3 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md transition-all duration-300 cursor-default"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold border px-2 py-0.5 rounded-full mt-0.5 ${c.whyTag}`}
                    >
                      {card.icon}
                      {card.why}
                    </span>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm leading-snug">
                      {card.title}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {card.body}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
