/**
 * SessionStart hook — injects project context into every new agent session.
 * Reads project-memory.md and outputs a systemMessage so the agent
 * automatically has full context without the user asking.
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..", "..");
const workspaceRoot = path.resolve(repoRoot, "..");
const memoryPath = path.join(workspaceRoot, ".claude", "project-memory.md");
const lessonsPath = path.join(workspaceRoot, ".claude", "lessons.md");

let context = "";

// Read project memory
try {
  const memory = fs.readFileSync(memoryPath, "utf8");
  // Extract just the Last Session Summary section for brevity
  const lastSessionMatch = memory.match(/## Last Session Summary[\s\S]*?(?=\n---|\n## Git Quick)/);
  if (lastSessionMatch) {
    context += "=== LAST SESSION STATE ===\n" + lastSessionMatch[0].trim() + "\n\n";
  }
} catch {
  context += "⚠️ Could not read project-memory.md\n";
}

// Read lesson count
try {
  const lessons = fs.readFileSync(lessonsPath, "utf8");
  const lessonCount = (lessons.match(/^## Lesson \d+/gm) || []).length;
  context += `=== LESSONS: ${lessonCount} rules loaded (read .claude/lessons.md for details) ===\n`;
} catch {
  context += "⚠️ Could not read lessons.md\n";
}

context += "\n📋 PROTOCOL: Read .claude/project-memory.md and .claude/lessons.md fully before starting work. Brief user on session state.";

// Output for hook system
const output = {
  systemMessage: context,
};

process.stdout.write(JSON.stringify(output));
