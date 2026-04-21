/**
 * Stop hook — reminds the agent to update docs before session ends.
 * Outputs a systemMessage reminding to update project-memory.md, lessons.md, and README.md.
 * Also reminds about running `npm run sync:docs` which regenerates auto-synced blocks
 * in README.md and all .claude/*.md files from content (no manual editing needed).
 */
const output = {
  systemMessage: [
    "⚠️ SESSION ENDING — Complete these before stopping:",
    "1. Run `npm run sync:docs` — regenerates auto-synced blocks in README + .claude/*.md + copilot-instructions.md",
    "2. Run `npm run ship` (or `npm run verify:deploy`) if code changed — enforces local + CI + live verification. NEVER confirm success to user until all phases are green.",
    "3. Update .claude/project-memory.md 'Last Session Summary' with: date, completed items, phase status, changed files, last commit hash",
    "4. If any corrections/new patterns: add to .claude/lessons.md",
    "5. If new code patterns established: update .claude/patterns.md",
    "6. If architecture changed: update .claude/architecture.md",
    "7. If notable features added: update portfolio/README.md (feature list — NOT the stats block, which sync:docs handles)",
    "8. Commit and push if user approved — the sync-docs GitHub Action will auto-refresh stats on push",
  ].join("\n"),
};

process.stdout.write(JSON.stringify(output));
