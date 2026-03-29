# Saurav Raghuvanshi — Portfolio

**Digital Cloud Solution Architect @ Microsoft** · Bengaluru, India

> I help high-growth startups and unicorns build AI-powered, cloud-native platforms at scale.

**Live site:** https://saurav-portfolio.azurewebsites.net
[![Build and Deploy to Azure](https://github.com/sauravraghuvanshi/portfolio/actions/workflows/deploy.yml/badge.svg)](https://github.com/sauravraghuvanshi/portfolio/actions/workflows/deploy.yml)

---

## Features

- **Portfolio & Resume** — Skills, certifications, projects, case studies, downloadable PDF resume
- **Interactive Career Timeline** — Vertical timeline with expanding cards, animated stat counters, tech badges, milestone icons, and "Present" pulse badge
- **Command Palette** — Spotlight-style search (Cmd+K / Ctrl+K) across blogs, case studies, projects, talks, events, and pages with fuzzy matching
- **Speaking & Events** — 32 speaking engagements with photo galleries, filters, and interactive speaking footprint map
- **Speaking Events Map** — India-centered interactive SVG map with glowing pins, image-rich popups, city filtering, and dark-mode glow effects (`react-simple-maps`)
- **YouTube Talks** — 12 sessions with lazy-loaded embeds (thumbnail-first, iframe on click)
- **Technical Blog** — MDX-powered blog with rich typography, syntax highlighting, reading time, Table of Contents with scroll-spy, and related posts
- **Social Sharing** — LinkedIn (copies post text + opens composer), X/Twitter, and copy link on blog posts
- **RSS Feed** — Auto-generated RSS feed at `/feed.xml` with link auto-discovery
- **Hero Animations** — Smooth rotating subtitle phrases with AnimatePresence transitions
- **Scroll Progress** — Reading progress bar on blog and case study detail pages
- **Code Copy Button** — Hover-to-reveal copy button on all MDX code blocks
- **Noise Texture** — Subtle SVG noise overlay for visual depth
- **AI Writer** — AI-powered content creation assistant at `/admin/ai-writer` using Azure AI Foundry Agent with Vercel AI SDK v5 streaming, content type selection (Blog, Case Study, Project, Talk, Event, Social), and save-to-CMS integration
- **Admin Panel** — Protected dashboard at `/admin` with authentication, managing blogs, case studies, projects, talks, events, and certifications
- **Blog Editor** — Medium-style MDX editor with live preview, image upload, and drag-and-drop media
- **Case Study Editor** — MDX editor for case studies with metrics, timeline, role, and client fields
- **Project Editor** — Form-based editor for projects with outcomes, tech stack, and category fields
- **Talk Editor** — Form-based editor for YouTube talks with title, topic, description, and featured flag
- **Event Editor** — Full editor for events with highlights, impact, image upload, and featured flag
- **Certification Editor** — Form-based editor for certifications with badge image upload, color picker, and verification URL
- **Multi-Select Categories** — All content types support multiple categories with custom category input
- **Media Resize** — Inline image resize controls in the editor
- **Azure Blob Storage** — Images stored in Azure Blob Storage with organized hierarchy (`blog/`, `events/`, `case-studies/`, `certifications/`)
- **Dark/Light Mode** — System-aware theme toggle with zero flash
- **SEO** — JSON-LD schema (Person, WebSite, BreadcrumbList, SpeakingEvent, CaseStudy), OpenGraph/Twitter cards, sitemap, robots.txt
- **Reduced Motion** — Global `MotionConfig reducedMotion="user"` respects `prefers-reduced-motion`
- **Responsive** — Mobile-first design with Framer Motion animations

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) · TypeScript · `output: "standalone"` |
| Styling | Tailwind CSS v4 (CSS variables, no config file) |
| Animation | Framer Motion |
| Content | JSON + MDX (no CMS) |
| Auth | NextAuth v5 (Credentials provider, JWT sessions) |
| Editor | `@uiw/react-md-editor` with custom toolbar |
| Image Storage | Azure Blob Storage (`@azure/storage-blob`) |
| AI | Vercel AI SDK v5 (`ai`, `@ai-sdk/azure`, `@ai-sdk/react`) |
| AI Backend | Azure AI Foundry (`saurav-portfolio-ai`, East US) |
| Deployment | Azure App Service (Linux, Node 20 LTS, F1 Free) |
| CI/CD | GitHub Actions → Kudu zip-deploy |

---

## Local Development

```bash
cd portfolio
cp .env.example .env.local   # configure admin credentials + Azure storage
npm install
npm run dev                   # http://localhost:3000
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ADMIN_USERNAME` | Yes | Admin panel login username |
| `ADMIN_PASSWORD` | Yes | Admin panel login password |
| `AUTH_SECRET` | Yes | NextAuth secret (`openssl rand -base64 32`) |
| `AUTH_TRUST_HOST` | Yes | Set to `true` |
| `AZURE_STORAGE_CONNECTION_STRING` | Yes | Azure Blob Storage connection string |
| `AZURE_STORAGE_CONTAINER_NAME` | Yes | Container name (default: `blog-images`) |
| `NEXT_PUBLIC_AZURE_STORAGE_URL` | Yes | Public blob URL base (build-time inlined) |
| `AZURE_OPENAI_ENDPOINT` | No | Azure AI Foundry endpoint (for AI Writer) |
| `AZURE_OPENAI_API_KEY` | No | Azure AI Foundry API key (for AI Writer) |
| `AZURE_OPENAI_DEPLOYMENT` | No | GPT-4o deployment name (default: `gpt-4o`) |
| `BING_SEARCH_KEY` | No | Bing Search API key (for AI Writer grounding) |

> On Azure App Service, also set `AUTH_URL` to the public site URL (required for NextAuth callback resolution).

---

## Content Pipeline

### Blog Posts (admin panel or manual)

- **Via Admin Panel:** Login at `/admin`, create/edit posts with the visual editor. Images upload to Azure Blob Storage automatically under `blog/<slug>/`.
- **Manual:** Create `.mdx` files in `content/blog/` with frontmatter (title, slug, description, date, category, tags, coverImage, status, featured).

### Case Studies (admin panel or manual)

- **Via Admin Panel:** Login at `/admin`, create/edit case studies with the MDX editor. Images upload to Azure Blob Storage under `case-studies/<slug>/`.
- **Manual:** Create `.mdx` files in `content/case-studies/` with frontmatter (title, subtitle, slug, tags, category, timeline, role, client, featured, coverImage, metrics).

### Projects (admin panel or manual)

- **Via Admin Panel:** Login at `/admin`, create/edit projects with the form editor.
- **Manual:** Edit `content/projects.json` directly.

### Talks (admin panel or manual)

- **Via Admin Panel:** Login at `/admin`, create/edit talks. Set featured to display on homepage.
- **Manual:** Edit `content/talks.json` — add `{ "id": "VIDEO_ID", "title": "...", "topic": "...", "featured": true/false }`.

### Events (admin panel or auto-generated)

Events can be managed via the admin panel or auto-generated from DOCX files:

```
My Events/          ← source DOCX files + photos (local only, not in repo)
    ↓
npm run generate-events
    ↓
content/events.json          ← committed to repo
public/events/{slug}/*.jpg   ← committed to repo
```

- **Via Admin Panel:** Login at `/admin`, create/edit events. Upload cover images and additional photos to Azure Blob Storage under `events/<slug>/`. Set featured to display on homepage.
- **Overrides:** `content/events-overrides.json` stores manual corrections. The generator merges overrides automatically. Admin edits persist to both `events.json` (immediate effect) and `events-overrides.json` (survives DOCX regeneration).

### Certifications (admin panel or manual)

- **Via Admin Panel:** Login at `/admin`, create/edit certifications. Upload badge images to Azure Blob Storage under `certifications/<code>/`.
- **Manual:** Edit `content/certifications.json` — each entry has `code` (unique key), `name`, `issuer`, `year`, `verifyUrl`, `badge`, `color`.

---

## Architecture

```
portfolio/
├── app/
│   ├── layout.tsx                    # Root layout (nav, footer, fonts, SEO)
│   ├── page.tsx                      # Homepage (11 sections)
│   ├── sitemap.ts                    # Auto-generated sitemap
│   ├── robots.ts                     # robots.txt
│   ├── not-found.tsx                 # 404 page
│   ├── blog/
│   │   ├── page.tsx                  # Blog listing with search/filter
│   │   ├── [slug]/page.tsx           # Blog post detail (rich reader)
│   │   └── images/[...path]/route.ts # Legacy image fallback
│   ├── admin/
│   │   ├── layout.tsx                # Admin layout (sidebar)
│   │   ├── page.tsx                  # Admin dashboard
│   │   ├── login/page.tsx            # Login page
│   │   ├── blog/
│   │   │   ├── page.tsx              # Blog post list (admin)
│   │   │   ├── new/page.tsx          # Create new post
│   │   │   └── [slug]/edit/page.tsx  # Edit existing post
│   │   ├── case-studies/
│   │   │   ├── page.tsx              # Case study list (admin)
│   │   │   ├── new/page.tsx          # Create new case study
│   │   │   └── [slug]/edit/page.tsx  # Edit existing case study
│   │   ├── projects/
│   │   │   ├── page.tsx              # Project list (admin)
│   │   │   ├── new/page.tsx          # Create new project
│   │   │   └── [id]/edit/page.tsx    # Edit existing project
│   │   ├── talks/
│   │   │   ├── page.tsx              # Talk list (admin)
│   │   │   ├── new/page.tsx          # Create new talk
│   │   │   └── [id]/edit/page.tsx    # Edit existing talk
│   │   ├── events/
│   │   │   ├── page.tsx              # Event list (admin)
│   │   │   ├── new/page.tsx          # Create new event
│   │   │   └── [slug]/edit/page.tsx  # Edit existing event
│   │   ├── certifications/
│   │   │   ├── page.tsx              # Certification list (admin)
│   │   │   ├── new/page.tsx          # Create new certification
│   │   │   └── [code]/edit/page.tsx  # Edit existing certification
│   │   └── ai-writer/
│   │       └── page.tsx              # AI Writer — content creation assistant
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts  # NextAuth handler
│   │   └── admin/
│   │       ├── blog/route.ts         # POST — create blog post
│   │       ├── blog/[slug]/route.ts  # PUT/DELETE — update/delete post
│   │       ├── case-studies/route.ts  # POST — create case study
│   │       ├── case-studies/[slug]/route.ts  # PUT/DELETE — update/delete case study
│   │       ├── projects/route.ts     # POST — create project
│   │       ├── projects/[id]/route.ts  # PUT/DELETE — update/delete project
│   │       ├── talks/route.ts        # POST — create talk
│   │       ├── talks/[id]/route.ts   # PUT/DELETE — update/delete talk
│   │       ├── events/route.ts       # POST — create event
│   │       ├── events/[slug]/route.ts  # PUT/DELETE — update/delete event
│   │       ├── certifications/route.ts  # POST — create certification
│   │       ├── certifications/[code]/route.ts  # PUT/DELETE — update/delete certification
│   │       ├── upload/route.ts       # POST — image upload to Azure Blob
│   │       └── ai-writer/route.ts    # POST — AI Writer streaming chat endpoint
│   ├── case-studies/
│   │   ├── page.tsx                  # Case studies listing
│   │   └── [slug]/page.tsx           # Individual case study (MDX)
│   ├── events/
│   │   ├── page.tsx                  # Events listing with filters
│   │   └── [slug]/page.tsx           # Event detail + photo gallery
│   ├── projects/page.tsx             # Projects gallery
│   ├── resume/page.tsx               # Resume page + PDF download
│   ├── social/page.tsx               # Social links
│   └── talks/page.tsx                # YouTube talks with topic filters
├── components/
│   ├── layout/                       # Navigation, Footer, LayoutShell
│   ├── sections/                     # Homepage sections + BlogGrid, FeaturedBlogPosts, CareerTimeline, SpeakingMap
│   ├── timeline/                     # TimelineCard, StatCounter (career timeline)
│   ├── admin/                        # AdminSidebar, BlogEditor, CaseStudyEditor, ProjectEditor, TalkEditor, EventEditor, CertificationEditor, AIWriter, CategoryMultiSelect, MediaResizeBar, DeleteItemButton
│   ├── admin/ai-writer/              # ContentTypeSelector, ChatMessages, ContentPreview
│   ├── events/                       # EventGallery (lightbox)
│   └── ui/                           # Primitives (Badge, Card, YouTubeEmbed, CommandPalette, ShareButtons, ScrollProgress, CodeBlock, TableOfContents, etc.)
├── content/
│   ├── profile.json                  # Personal info, skills, experience
│   ├── certifications.json           # 10 certifications (standalone, managed via admin)
│   ├── events.json                   # Generated — 32 speaking events
│   ├── events-overrides.json         # Manual overrides merged at build time
│   ├── projects.json                 # Project gallery data
│   ├── talks.json                    # 12 YouTube session IDs
│   ├── case-studies/                 # MDX case studies
│   └── blog/                         # MDX blog posts
├── lib/
│   ├── content.ts                    # Data loading (profiles, blogs, events, talks)
│   ├── admin.ts                      # Blog, Case Study, Project, Talk, Event, Certification CRUD + image upload helpers
│   ├── ai/                           # AI Writer helpers
│   │   ├── content-schemas.ts        # Content type configs + question sets
│   │   ├── system-prompt.ts          # Dynamic system prompt builder
│   │   ├── grounding.ts              # Bing Search + Azure AI Search helpers
│   │   └── portfolio-context.ts      # RAG context from existing portfolio content
│   ├── azure-storage.ts              # Azure Blob Storage client (uploadToBlob)
│   ├── mdx-components.tsx            # Shared MDX component map
│   └── utils.ts                      # cn(), formatDate(), etc.
├── auth.ts                           # NextAuth v5 config (Credentials provider)
├── middleware.ts                      # Protects /admin/* routes
├── scripts/
│   ├── generate-events.mjs           # DOCX → events.json + photos
│   └── postbuild.mjs                 # Copies public/ + static/ into standalone/
└── public/                           # Static assets (images, resume PDF)
```

---

## Pages

| Route | Description |
|---|---|
| `/` | Homepage — Hero, About, Skills, Case Studies, Projects, Talks, Blog, Speaking, Certs, Contact |
| `/blog` | Blog listing with category filter and search |
| `/blog/[slug]` | Blog post — rich typography, reading time, cover image |
| `/talks` | 12 YouTube sessions with topic filters |
| `/events` | 32 speaking & community events with filters |
| `/events/[slug]` | Event detail — description, highlights, photo gallery |
| `/case-studies` | Architecture case studies |
| `/case-studies/[slug]` | Individual case study (MDX) |
| `/projects` | Full project gallery with filters |
| `/resume` | HTML resume with interactive career timeline + PDF download |
| `/social` | Social links hub |
| `/feed.xml` | RSS feed (auto-generated) |
| `/admin` | Admin dashboard (protected) |
| `/admin/blog` | Blog post management |
| `/admin/blog/new` | Create new blog post |
| `/admin/blog/[slug]/edit` | Edit existing blog post |
| `/admin/case-studies` | Case study management |
| `/admin/case-studies/new` | Create new case study |
| `/admin/case-studies/[slug]/edit` | Edit existing case study |
| `/admin/projects` | Project management |
| `/admin/projects/new` | Create new project |
| `/admin/projects/[id]/edit` | Edit existing project |
| `/admin/talks` | Talk management |
| `/admin/talks/new` | Create new talk |
| `/admin/talks/[id]/edit` | Edit existing talk |
| `/admin/events` | Event management |
| `/admin/events/new` | Create new event |
| `/admin/events/[slug]/edit` | Edit existing event |
| `/admin/certifications` | Certification management |
| `/admin/certifications/new` | Create new certification |
| `/admin/certifications/[code]/edit` | Edit existing certification |
| `/admin/ai-writer` | AI Writer — content creation assistant |

---

## Deployment

CI/CD is fully automated via GitHub Actions. Every push to `main`:

1. Installs dependencies (`npm ci`)
2. Builds (`npm run build` — prebuild + Next.js + postbuild)
3. Zips `.next/standalone/`
4. Deploys to Azure App Service via Kudu zip-deploy

### Azure Infrastructure

| Resource | Value |
|---|---|
| App Service | `saurav-portfolio.azurewebsites.net` |
| Storage Account | `sauravportfoliomedia` |
| Blob Container | `blog-images` (public access) — organized as `blog/`, `events/`, `case-studies/`, `certifications/` subfolders |
| AI Foundry | `saurav-portfolio-ai` (East US, AIServices, S0) |
| Region | Central India (App Service) · East US (AI Foundry) |
| Plan | F1 Free (Linux, Node 20) |

### GitHub Secrets

| Secret | Description |
|---|---|
| `AZURE_DEPLOY_USER` | Kudu zip-deploy username |
| `AZURE_DEPLOY_PASSWORD` | Kudu zip-deploy password |

See [`AZURE-DEPLOY.md`](../AZURE-DEPLOY.md) for manual deployment steps and troubleshooting.

---

## Performance & Security

- [x] `next/font` for zero-CLS font loading
- [x] AVIF/WebP image formats via `next/image`
- [x] YouTube embeds lazy-loaded (thumbnail first, iframe on click)
- [x] Blog images served from Azure Blob Storage with immutable cache headers
- [x] Security headers (X-Content-Type-Options, X-Frame-Options, XSS-Protection, Referrer-Policy, Permissions-Policy)
- [x] `prefers-reduced-motion` respected by Framer Motion
- [x] Semantic HTML + ARIA labels
- [x] Keyboard navigation + skip-to-content
- [x] Dark/light mode with zero flash
- [x] JSON-LD schema (Person, WebSite, CreativeWork, BreadcrumbList, SpeakingEvent, CaseStudy)
- [x] `sitemap.xml` + `robots.txt`
- [x] OpenGraph + Twitter card metadata per page
- [x] Admin routes protected by NextAuth middleware

---

## Connect

- LinkedIn: [linkedin.com/in/sauravraghuvanshi](https://www.linkedin.com/in/sauravraghuvanshi/)
- GitHub: [github.com/sauravraghuvanshi](https://github.com/sauravraghuvanshi)
- X/Twitter: [@Saurav_Raghu](https://x.com/Saurav_Raghu)
