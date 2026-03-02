# Alex Morgan — Cloud Solution Architect Portfolio

A premium, responsive portfolio website built with Next.js 15 (App Router), TypeScript, Tailwind CSS, and Framer Motion.

## Quick start

```bash
npm install
npm run dev
# Visit http://localhost:3000
```

## Customizing content

All content is stored in plain JSON and MDX files — no code changes required for most updates.

### 1. Update your personal info

Edit `content/profile.json`:

| Field | What to update |
|-------|----------------|
| `name` | Your full name |
| `title` | Your job title |
| `tagline` | One-line value proposition |
| `location` | City, state, remote preference |
| `email` | Your contact email |
| `social` | LinkedIn, GitHub, Twitter, Calendly URLs |
| `summary` | 2–3 sentence bio |
| `credibilityStats` | years of experience, # projects, key metrics |
| `whatImKnownFor` | 4–6 bullet points |
| `skills` | Skill groups and items |
| `certifications` | Your actual certifications |
| `testimonials` | Real quotes from clients/colleagues |
| `speaking` | Conference talks, workshops |
| `experience` | Work history with highlights |

### 2. Replace placeholder case studies

Each case study is a `.mdx` file in `content/case-studies/`. Three sample case studies are provided. To add or replace:

1. Copy one of the existing `.mdx` files
2. Update the frontmatter:

```yaml
---
title: "Your Case Study Title"
subtitle: "Brief subtitle"
slug: "your-case-study-slug"
tags: ["Azure", "Terraform"]
category: "Cloud Architecture"
timeline: "Jan 2024 – Jun 2024"
role: "Lead Cloud Architect"
client: "Your Client (can be anonymized)"
featured: true
coverImage: "/images/case-studies/your-image.jpg"
metrics:
  - value: "61%"
    label: "Cost reduction"
  - value: "2 hrs"
    label: "Provisioning time"
---
```

3. Write the body in MDX (standard Markdown + JSX components)

### 3. Update projects

Edit `content/projects.json` — add, remove, or modify entries. Each project has:
- `id`, `title`, `description`
- `outcomes` — measurable results, max 3
- `tags`, `category`, `techStack`
- `githubUrl`, `liveUrl` — use `"#"` to hide the icon
- `featured` — shows on homepage if `true`

### 4. Add your resume PDF

Place your resume PDF at `public/resume.pdf`. The Resume page has a "Download PDF" button that links to it.

### 5. Add profile/cover images

- Profile placeholder: `public/images/profile.jpg`
- Case study covers: `public/images/case-studies/[name].jpg` (1200×630 recommended)
- Certification badges: `public/images/certs/[code].png`

### 6. Update the domain

Search-replace `alexmorgan.dev` with your actual domain in:
- `app/layout.tsx` (metadataBase)
- `app/sitemap.ts`
- `app/robots.ts`
- `components/JsonLd.tsx`

## Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage with all sections |
| `/case-studies` | All case studies listing |
| `/case-studies/[slug]` | Individual case study |
| `/projects` | Full project gallery with filters |
| `/resume` | HTML resume + PDF download |

## Deploying to Vercel

### Option A: Vercel CLI

```bash
npm i -g vercel
vercel --prod
```

### Option B: GitHub

1. Push this repo to GitHub
2. Visit [vercel.com](https://vercel.com) → New Project
3. Import your GitHub repo
4. Vercel auto-detects Next.js — click Deploy

### Custom domain

In Vercel dashboard → Settings → Domains → add your domain.

## Architecture

```
portfolio/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx           # Root layout (nav, footer, fonts, SEO)
│   ├── page.tsx             # Homepage
│   ├── sitemap.ts           # Auto-generated sitemap
│   ├── robots.ts            # robots.txt
│   ├── not-found.tsx        # 404 page
│   ├── case-studies/
│   │   ├── page.tsx         # Case studies listing
│   │   └── [slug]/page.tsx  # Individual case study (MDX)
│   ├── projects/page.tsx    # Projects gallery
│   └── resume/page.tsx      # Resume page
├── components/
│   ├── layout/              # Navigation, Footer
│   ├── sections/            # Homepage sections (Hero, About, Skills, etc.)
│   ├── ui/                  # Primitive components (Button, Badge, Card, etc.)
│   └── JsonLd.tsx           # JSON-LD schema components
├── content/
│   ├── profile.json         # Personal info, skills, certs, testimonials
│   ├── projects.json        # Project gallery data
│   └── case-studies/        # MDX case studies
├── lib/
│   ├── content.ts           # Content loading utilities
│   └── utils.ts             # cn(), formatDate(), etc.
└── public/                  # Static assets
```

## Performance checklist

- [x] next/font for zero-CLS font loading
- [x] AVIF/WebP image formats via next/image
- [x] Security headers (CSP, HSTS, X-Frame-Options)
- [x] `prefers-reduced-motion` respected by Framer Motion
- [x] Semantic HTML + ARIA labels
- [x] Skip-to-content link
- [x] Keyboard navigation
- [x] Dark/light mode with zero flash
- [x] JSON-LD schema (Person, WebSite, CreativeWork)
- [x] sitemap.xml + robots.txt
- [x] OpenGraph + Twitter card metadata per page

## Personalizing where to paste your values

After running locally and verifying the site works, replace the following placeholders:

| Placeholder | File | What to replace with |
|-------------|------|---------------------|
| `Alex Morgan` | `content/profile.json` | Your real name |
| `alex.morgan@example.com` | `content/profile.json` | Your real email |
| `Seattle, WA` | `content/profile.json` | Your location |
| `https://linkedin.com/in/alexmorgan` | `content/profile.json` | Your LinkedIn URL |
| `https://github.com/alexmorgan` | `content/profile.json` | Your GitHub URL |
| `https://calendly.com/alexmorgan/30min` | `content/profile.json` | Your Calendly or meeting link |
| `alexmorgan.dev` | Multiple files | Your domain |
| `(replace with real company)` | `content/profile.json` | Your actual employer names |
| `(replace with real metric)` | All MDX case studies | Your actual measured results |
| `/resume.pdf` | `public/` | Add your actual resume PDF |
