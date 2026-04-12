/**
 * Stop hook — reminds the agent to update docs before session ends.
 * Outputs a systemMessage reminding to update project-memory.md, lessons.md, and README.md.
 */
const output = {
  systemMessage: [
    "⚠️ SESSION ENDING — Complete these before stopping:",
    "1. Update .claude/project-memory.md 'Last Session Summary' with: date, completed items, phase status, changed files, last commit hash",
    "2. If any corrections/new patterns: add to .claude/lessons.md",
    "3. If notable features added: update portfolio/README.md",
    "4. Commit and push if user approved",
  ].join("\n"),
};

process.stdout.write(JSON.stringify(output));
