# Portfolio — Claude Code Instructions

## Project
- **Owner:** Saurav Raghuvanshi (Digital Cloud Solution Architect @ Microsoft)
- **Stack:** Next.js 16 App Router · TypeScript · Tailwind v4 · Framer Motion
- **Live:** https://saurav-portfolio.azurewebsites.net
- **Repo:** https://github.com/sauravraghuvanshi/portfolio
- **Local:** `C:\Users\sraghuvanshi\Downloads\Portfolio Website\portfolio\`

## Session Start Protocol
1. Read auto-memory `MEMORY.md` (loaded automatically)
2. Run `node scripts/audit.mjs` if doing audit work
3. Brief status to user

## Workflow Rules
- **Plan first** — Enter plan mode for any task touching 3+ files or requiring architectural decisions
- **Verify before done** — Always run `NEXT_TURBOPACK=0 npx next build` after non-trivial changes
- **Never start dev server** — Tell the user to run `npm run dev` themselves
- **Push only after approval** — Never push to GitHub until user confirms changes look good on localhost
- **Self-improve** — After any correction, update `tasks/lessons.md` immediately
- **Clean repo** — Delete temp files, artifacts, stale configs at end of session

## Key Patterns
- **Events:** Never edit `events.json` directly — use `events-overrides.json`
- **Tailwind:** Full-string lookup maps for dynamic classes, never interpolate
- **AI SDK:** Vercel AI SDK v5 — `useChat` from `@ai-sdk/react`, `createUIMessageStream` from `ai`
- **Deploy:** Standalone zip via GitHub Actions CI/CD, never manual, never Oryx source build
- **Env vars:** Set new App Service env vars BEFORE pushing code that needs them
- **Auth:** `ManagedIdentityCredential` on production (detected via `WEBSITE_SITE_NAME`), `AzureCliCredential` on local
- **Logging:** `const log = isDev ? console.log : () => {};` — no console.log in production
- **Validation:** Zod `safeParse` at API boundary — schemas in `lib/api-schemas.ts`
- **RAG pipeline:** Create new → update agent → THEN delete old (never delete first)
- **GitHub auth:** Personal account `sauravraghuvanshi24@gmail.com` — use `gh auth login` if push fails
- **Turbopack:** Use `NEXT_TURBOPACK=0` for production builds (Turbopack has Windows ENOENT issues)

## Azure Infrastructure
| Resource | Value |
|---|---|
| Subscription | `60e58e3f-da14-4fa7-89dd-3d0369ddbc8b` (Visual Studio Enterprise) |
| RG | `rg-saurav-portfolio` (Central India) |
| App Service | `saurav-portfolio` (F1 Free, Linux, Node 20) |
| Storage | `sauravportfoliomedia` / container `blog-images` |
| AI Foundry | `saurav-portfolio-ai` (East US, AIServices, S0) |
| AI Project | `saurav-portfolio-ai-project` |
| AI Agent | `saurav-portfolio-ai-project-agent` |
| Deployment | `gpt-4o` (GlobalStandard, 10K TPM, model 2024-08-06) |
| Managed Identity | `b35f1102-df4f-4192-8c6f-f2185576f2cf` (Cognitive Services User) |

## CI/CD
```
git push origin main
  → GitHub Actions: install → build → zip .next/standalone/ → Kudu zipdeploy
  → Azure App Service auto-restarts
```
Secrets: `AZURE_DEPLOY_USER` + `AZURE_DEPLOY_PASSWORD` (ZipDeploy creds)

If deploy 401s, re-enable SCM basic auth:
```bash
az rest --method put \
  --uri "/subscriptions/60e58e3f-da14-4fa7-89dd-3d0369ddbc8b/resourceGroups/rg-saurav-portfolio/providers/Microsoft.Web/sites/saurav-portfolio/basicPublishingCredentialsPolicies/scm?api-version=2023-12-01" \
  --body '{"properties":{"allow":true}}'
```

## Context Files
- `tasks/lessons.md` — 47 learned rules from past mistakes
- `tasks/project-memory.md` — Full project context, routes, infra details
- `tasks/feature-suggestions.md` — Feature backlog (Tier 0-3)
- `tasks/agent-instructions.md` — AI Foundry agent prompt config


## Session Start Protocol (ALWAYS do this first)

At the start of EVERY new session, before doing anything else:
1. Read `tasks/project-memory.md` — full project context, architecture, last session state
2. Read `tasks/lessons.md` — learned rules to avoid repeating past mistakes
3. Run `node scripts/audit.mjs` and read the summary output
4. Briefly tell the user: "Context loaded — [one line summary of where we left off]. Audit: [grade] — [X] critical, [Y] high, [Z] medium findings"
5. If any critical or high findings exist, flag them immediately

At the END of every session, update the "Last Session Summary" section in `tasks/project-memory.md` with what was completed and the last commit hash.

---

## WorkfLow Orchestration
### 1. PLan Node Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways,
STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity
### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One tack per subagent for focused execution
### 3. Self-Improvement Loop
- After ANY correction from the user: update tasks/lessons. md" with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project
### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself:
"Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness
### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it
### 6. Autonomous Bug Fizing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests - then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how
## Task Management
1. *Plan First*: Write plan to 'tasks/todo.md" with checkable items
2. *Verify Plan*: Check in before starting implementation
3. *Track Progress*: Mark items complete as you go
4. *Explain Changes*: High-level summary at each step
5. *Document Results*: Add review section to "tasks/todo.md"
6. *Capture Lessons*: Update tasks/Lessons. md after corrections
## Core Principles
- *Simplicity First*: Make every change as simple as possible. Impact minimal code.
- *No Laziness*: Find root causes. No temporary fixes. Senior developer standards.▲ 
- *Minimat Impact*: Changes should only touch what's necessary. Avoid introducing bugs.