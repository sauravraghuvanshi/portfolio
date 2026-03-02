# Saurav Raghuvanshi — Portfolio

**Digital Cloud Solution Architect @ Microsoft** · Bengaluru, India

> I help high-growth startups and unicorns build AI-powered, cloud-native platforms at scale.

**Live site:** https://sauravraghuvanshi-portfolio.azurewebsites.net
[![Build and Deploy to Azure](https://github.com/sauravraghuvanshi/portfolio/actions/workflows/deploy.yml/badge.svg)](https://github.com/sauravraghuvanshi/portfolio/actions/workflows/deploy.yml)

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) · TypeScript |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Content | JSON + MDX (no CMS) |
| Deployment | Azure App Service (Linux, Node 20 LTS) |
| CI/CD | GitHub Actions → Azure |

---

## Local development

```bash
cd portfolio
npm install
npm run dev
# http://localhost:3000
```

> `npm run dev` uses the current `content/events.json`. To regenerate from source Word docs, place the `My Events/` folder one level above `portfolio/` and run `npm run generate-events`.

---

## Content pipeline

Event data (speaking engagements, community sessions, workshops) is generated from Word documents:

```
My Events/          ← source DOCX files + photos (local only, not in repo)
    ↓
npm run generate-events
    ↓
content/events.json          ← committed to repo
public/events/{slug}/*.jpg   ← committed to repo
    ↓
next build → 46 static pages
```

When new events are added locally:
```bash
npm run generate-events   # reads My Events/, writes content/events.json + public/events/
git add content/events.json public/events/
git commit -m "content: add new events"
git push                  # triggers CI/CD → auto-deploys
```

---

## Deployment

CI/CD is fully automated via GitHub Actions. Every push to `main`:
1. Installs dependencies
2. Runs `npm run build` (prebuild + Next.js build + postbuild)
3. Zips `.next/standalone/`
4. Deploys to Azure App Service

See [`AZURE-DEPLOY.md`](../AZURE-DEPLOY.md) for manual deployment steps and troubleshooting.

---

## Architecture

```
portfolio/
├── app/                        # Next.js App Router pages
│   ├── layout.tsx              # Root layout (nav, footer, fonts, SEO)
│   ├── page.tsx                # Homepage (all sections)
│   ├── sitemap.ts              # Auto-generated sitemap
│   ├── robots.ts               # robots.txt
│   ├── not-found.tsx           # 404 page
│   ├── case-studies/
│   │   ├── page.tsx            # Case studies listing
│   │   └── [slug]/page.tsx     # Individual case study (MDX)
│   ├── events/
│   │   ├── page.tsx            # Events listing with filters
│   │   └── [slug]/page.tsx     # Individual event detail + gallery
│   ├── projects/page.tsx       # Projects gallery
│   ├── resume/page.tsx         # Resume page + PDF download
│   └── social/page.tsx         # Social links
├── components/
│   ├── layout/                 # Navigation, Footer
│   ├── sections/               # Homepage sections (Hero, About, Skills, Speaking, etc.)
│   ├── events/                 # EventGallery (lightbox)
│   └── ui/                     # Primitives (Button, Badge, Card, etc.)
├── content/
│   ├── profile.json            # Personal info, skills, certs, testimonials, experience
│   ├── events.json             # Generated — 32 speaking/community events
│   ├── events-overrides.json   # Manual overrides merged at build time
│   ├── projects.json           # Project gallery data
│   └── case-studies/           # MDX case studies
├── scripts/
│   ├── generate-events.mjs     # Parses My Events/ DOCX → events.json + photos
│   └── postbuild.mjs           # Copies public/ + .next/static/ into standalone/
├── lib/
│   ├── content.ts              # Data loading utilities
│   └── utils.ts                # cn(), formatDate(), etc.
└── public/                     # Static assets (images, events photos, resume PDF)
```

---

## Pages

| Route | Description |
|---|---|
| `/` | Homepage — Hero, About, Skills, Featured Work, Speaking, Contact |
| `/events` | 32 speaking & community events with filters |
| `/events/[slug]` | Event detail — description, highlights, photo gallery |
| `/case-studies` | Architecture case studies |
| `/case-studies/[slug]` | Individual case study (MDX) |
| `/projects` | Full project gallery with filters |
| `/resume` | HTML resume + PDF download |

---

## Performance

- [x] `next/font` for zero-CLS font loading
- [x] AVIF/WebP image formats via `next/image`
- [x] Security headers (X-Frame-Options, CSP, Referrer-Policy)
- [x] `prefers-reduced-motion` respected by Framer Motion
- [x] Semantic HTML + ARIA labels
- [x] Keyboard navigation + skip-to-content
- [x] Dark/light mode with zero flash
- [x] JSON-LD schema (Person, WebSite, CreativeWork)
- [x] `sitemap.xml` + `robots.txt`
- [x] OpenGraph + Twitter card metadata per page

---

## Connect

- LinkedIn: [linkedin.com/in/sauravraghuvanshi](https://www.linkedin.com/in/sauravraghuvanshi/)
- GitHub: [github.com/sauravraghuvanshi](https://github.com/sauravraghuvanshi)
- X/Twitter: [@Saurav_Raghu](https://x.com/Saurav_Raghu)
