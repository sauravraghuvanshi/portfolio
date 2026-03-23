// scripts/audit.mjs
// Static code analysis audit for the portfolio website.
// Generates a self-contained HTML report at tasks/audit-report.html
// Usage: node scripts/audit.mjs

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, "..");
const TASKS_DIR = path.join(PROJECT_ROOT, "..", "tasks");

const IGNORE = ["node_modules", ".next", ".git", "__azurite"];

// ---------------------------------------------------------------------------
// File utilities
// ---------------------------------------------------------------------------

function findFiles(dir, extensions, ignore = IGNORE) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (ignore.some((i) => full.includes(i))) continue;
    if (entry.isDirectory()) {
      results.push(...findFiles(full, extensions, ignore));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

function readSafe(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
}

function readJSON(filePath) {
  const raw = readSafe(filePath);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function rel(absPath) {
  return path.relative(PROJECT_ROOT, absPath).replace(/\\/g, "/");
}

function lineCount(content) {
  return content.split("\n").length;
}

function findLineNumber(content, pattern) {
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(pattern)) return i + 1;
  }
  return null;
}

/** Check if a line number is wrapped in try-catch by looking backwards. */
function isInsideTryCatch(content, targetLine) {
  const lines = content.split("\n");
  let braceDepth = 0;
  for (let i = targetLine - 1; i >= Math.max(0, targetLine - 30); i--) {
    const line = lines[i];
    braceDepth += (line.match(/\}/g) || []).length;
    braceDepth -= (line.match(/\{/g) || []).length;
    if (line.match(/\btry\s*\{/) && braceDepth <= 0) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Code Quality Checks
// ---------------------------------------------------------------------------

function checkMDXTryCatch() {
  const findings = [];
  const files = findFiles(path.join(PROJECT_ROOT, "app"), [".tsx"]);
  for (const f of files) {
    const content = readSafe(f);
    if (!content || !content.includes("compileMDX(")) continue;
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("compileMDX(") && !isInsideTryCatch(content, i)) {
        findings.push({
          id: "CQ-001", severity: "MEDIUM",
          title: "compileMDX() call without try-catch",
          file: rel(f), line: i + 1,
          description: "If MDX content is malformed, this crashes the page with a 500 error.",
          recommendation: "Wrap compileMDX() in try-catch with a fallback error message.",
        });
      }
    }
  }
  if (findings.length === 0) {
    findings.push({ id: "CQ-001", severity: "INFO", title: "All compileMDX() calls have error handling", description: "Every compileMDX() call is wrapped in try-catch." });
  }
  return findings;
}

function checkJSONParseTryCatch() {
  const findings = [];
  const files = [
    ...findFiles(path.join(PROJECT_ROOT, "lib"), [".ts"]),
    ...findFiles(path.join(PROJECT_ROOT, "app"), [".ts", ".tsx"]),
  ];
  for (const f of files) {
    const content = readSafe(f);
    if (!content) continue;
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("JSON.parse(") && !isInsideTryCatch(content, i)) {
        // Skip if inside a function that's itself inside cache() — the outer call handles it
        findings.push({
          id: "CQ-002", severity: "LOW",
          title: "JSON.parse() without try-catch",
          file: rel(f), line: i + 1,
          description: "Malformed JSON will crash the render. Consider wrapping in try-catch.",
          recommendation: "Add try-catch around JSON.parse with a sensible fallback.",
          codeSnippet: lines[i].trim(),
        });
      }
    }
  }
  if (findings.length === 0) {
    findings.push({ id: "CQ-002", severity: "INFO", title: "All JSON.parse() calls are guarded", description: "No unprotected JSON.parse() calls found." });
  }
  return findings;
}

function checkExistsSyncGuards() {
  const findings = [];
  const files = findFiles(path.join(PROJECT_ROOT, "lib"), [".ts"]);
  for (const f of files) {
    const content = readSafe(f);
    if (!content) continue;
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("readFileSync(")) {
        // Check 10 lines above for existsSync
        const context = lines.slice(Math.max(0, i - 10), i + 1).join("\n");
        if (!context.includes("existsSync")) {
          findings.push({
            id: "CQ-003", severity: "MEDIUM",
            title: "readFileSync without existsSync guard",
            file: rel(f), line: i + 1,
            description: "File read will throw ENOENT if the file doesn't exist.",
            recommendation: "Add fs.existsSync() check before reading.",
            codeSnippet: lines[i].trim(),
          });
        }
      }
    }
  }
  if (findings.length === 0) {
    findings.push({ id: "CQ-003", severity: "INFO", title: "All file reads have existsSync guards", description: "Every readFileSync is preceded by an existsSync check." });
  }
  return findings;
}

function checkConsoleLog() {
  const findings = [];
  const files = [
    ...findFiles(path.join(PROJECT_ROOT, "app"), [".ts", ".tsx"]),
    ...findFiles(path.join(PROJECT_ROOT, "lib"), [".ts"]),
    ...findFiles(path.join(PROJECT_ROOT, "components"), [".tsx"]),
  ];
  for (const f of files) {
    const content = readSafe(f);
    if (!content) continue;
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/\bconsole\.log\(/) && !lines[i].trim().startsWith("//")) {
        findings.push({
          id: "CQ-004", severity: "LOW",
          title: "console.log in production code",
          file: rel(f), line: i + 1,
          description: "Debug logging left in production code.",
          recommendation: "Remove or replace with console.error for intentional logging.",
          codeSnippet: lines[i].trim(),
        });
      }
    }
  }
  if (findings.length === 0) {
    findings.push({ id: "CQ-004", severity: "INFO", title: "No console.log in production code", description: "Clean — no debug logging found." });
  }
  return findings;
}

function checkLargeFiles() {
  const findings = [];
  const files = [
    ...findFiles(path.join(PROJECT_ROOT, "app"), [".tsx", ".ts"]),
    ...findFiles(path.join(PROJECT_ROOT, "components"), [".tsx"]),
    ...findFiles(path.join(PROJECT_ROOT, "lib"), [".ts"]),
  ];
  for (const f of files) {
    const content = readSafe(f);
    if (!content) continue;
    const lines = lineCount(content);
    if (lines > 500) {
      findings.push({ id: "CQ-005", severity: "MEDIUM", title: `Large file: ${lines} lines`, file: rel(f), description: `At ${lines} lines, consider splitting into smaller modules.`, recommendation: "Extract reusable pieces into separate components or utility files." });
    } else if (lines > 300) {
      findings.push({ id: "CQ-005", severity: "LOW", title: `File approaching size threshold: ${lines} lines`, file: rel(f), description: `At ${lines} lines, monitor for further growth.` });
    }
  }
  if (findings.length === 0) {
    findings.push({ id: "CQ-005", severity: "INFO", title: "All files under 300 lines", description: "Good file size discipline." });
  }
  return findings;
}

function checkHardcodedValues() {
  const findings = [];
  const files = [
    ...findFiles(path.join(PROJECT_ROOT, "app"), [".ts", ".tsx"]),
    ...findFiles(path.join(PROJECT_ROOT, "components"), [".tsx"]),
    ...findFiles(path.join(PROJECT_ROOT, "lib"), [".ts"]),
  ];
  const patterns = [
    { regex: /sauravraghuvanshi24@gmail\.com/, label: "hardcoded email address", ignore: ["constants.ts"] },
    { regex: /sauravraghuvanshi\.dev/, label: "hardcoded domain (should use SITE_URL)", ignore: ["constants.ts"] },
    { regex: /sauravportfoliomedia\.blob\.core\.windows\.net/, label: "hardcoded Azure blob hostname", ignore: ["next.config.ts", "azure-storage.ts"] },
  ];
  for (const f of files) {
    const content = readSafe(f);
    if (!content) continue;
    const fname = path.basename(f);
    for (const p of patterns) {
      if (p.ignore && p.ignore.includes(fname)) continue;
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (p.regex.test(lines[i])) {
          findings.push({
            id: "CQ-006", severity: "LOW",
            title: `Hardcoded value: ${p.label}`,
            file: rel(f), line: i + 1,
            description: `Found ${p.label} that should be extracted to a constant or config.`,
            recommendation: "Move to lib/constants.ts or read from profile.json.",
            codeSnippet: lines[i].trim(),
          });
        }
      }
    }
  }
  if (findings.length === 0) {
    findings.push({ id: "CQ-006", severity: "INFO", title: "No problematic hardcoded values", description: "All domains and emails are properly centralized." });
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Security Checks
// ---------------------------------------------------------------------------

function checkSecurityHeaders() {
  const findings = [];
  const content = readSafe(path.join(PROJECT_ROOT, "next.config.ts"));
  if (!content) {
    findings.push({ id: "SEC-002", severity: "HIGH", title: "next.config.ts not found", description: "Cannot verify security headers." });
    return findings;
  }
  const required = [
    { header: "X-Content-Type-Options", severity: "HIGH" },
    { header: "X-Frame-Options", severity: "HIGH" },
    { header: "Strict-Transport-Security", severity: "HIGH" },
    { header: "Content-Security-Policy", severity: "MEDIUM" },
    { header: "Referrer-Policy", severity: "MEDIUM" },
    { header: "Permissions-Policy", severity: "LOW" },
  ];
  const hasPoweredBy = content.includes("poweredByHeader: false") || content.includes("poweredByHeader:false");
  if (!hasPoweredBy) {
    findings.push({ id: "SEC-002", severity: "MEDIUM", title: "X-Powered-By header still exposed", file: "next.config.ts", description: "poweredByHeader is not disabled.", recommendation: 'Add poweredByHeader: false to next.config.ts.' });
  }
  for (const h of required) {
    if (!content.includes(h.header)) {
      findings.push({ id: "SEC-002", severity: h.severity, title: `Missing security header: ${h.header}`, file: "next.config.ts", description: `The ${h.header} header is not configured.`, recommendation: `Add ${h.header} to the headers() config in next.config.ts.` });
    }
  }
  if (findings.length === 0) {
    findings.push({ id: "SEC-002", severity: "INFO", title: "All security headers present", description: "Security headers are properly configured." });
  }
  return findings;
}

function checkDangerousHTML() {
  const findings = [];
  const files = [
    ...findFiles(path.join(PROJECT_ROOT, "app"), [".tsx"]),
    ...findFiles(path.join(PROJECT_ROOT, "components"), [".tsx"]),
  ];
  for (const f of files) {
    const content = readSafe(f);
    if (!content || !content.includes("dangerouslySetInnerHTML")) continue;
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes("dangerouslySetInnerHTML")) {
        // Check if it's a known safe pattern (JSON.stringify or hardcoded script)
        const context = lines.slice(Math.max(0, i - 5), Math.min(lines.length, i + 5)).join("\n");
        const isSafe = context.includes("JSON.stringify(") || context.includes("localStorage") || context.includes("application/ld+json");
        findings.push({
          id: "SEC-003", severity: isSafe ? "INFO" : "MEDIUM",
          title: isSafe ? "dangerouslySetInnerHTML (safe usage)" : "dangerouslySetInnerHTML with dynamic content",
          file: rel(f), line: i + 1,
          description: isSafe ? "Uses JSON.stringify or hardcoded inline script — safe." : "Injecting dynamic content via dangerouslySetInnerHTML. Verify no user input flows here.",
          recommendation: isSafe ? "No action needed." : "Audit the data flow to ensure no user-controlled content reaches this point.",
        });
      }
    }
  }
  if (findings.length === 0) {
    findings.push({ id: "SEC-003", severity: "INFO", title: "No dangerouslySetInnerHTML usage", description: "None found." });
  }
  return findings;
}

function checkUploadMIME() {
  const findings = [];
  const content = readSafe(path.join(PROJECT_ROOT, "app", "api", "admin", "upload", "route.ts"));
  if (!content) {
    findings.push({ id: "SEC-004", severity: "HIGH", title: "Upload route not found", description: "Cannot verify upload validation." });
    return findings;
  }
  if (!content.includes("allowedTypes") && !content.includes("file.type")) {
    findings.push({ id: "SEC-004", severity: "HIGH", title: "No MIME type validation on upload", file: "app/api/admin/upload/route.ts", description: "File uploads should check Content-Type." });
  }
  if (!content.includes("isValidImageMagic") && !content.includes("magic")) {
    findings.push({ id: "SEC-004", severity: "MEDIUM", title: "No magic byte validation on upload", file: "app/api/admin/upload/route.ts", description: "Content-Type headers can be spoofed. Check actual file bytes." });
  }
  if (!content.includes("file.size") && !content.includes("5 * 1024")) {
    findings.push({ id: "SEC-004", severity: "MEDIUM", title: "No file size limit on upload", file: "app/api/admin/upload/route.ts", description: "Missing file size check." });
  }
  if (!content.includes("auth(") && !content.includes("session")) {
    findings.push({ id: "SEC-004", severity: "CRITICAL", title: "Upload route has no authentication", file: "app/api/admin/upload/route.ts", description: "Anyone can upload files." });
  }
  if (findings.length === 0) {
    findings.push({ id: "SEC-004", severity: "INFO", title: "Upload route properly secured", description: "Auth, MIME, magic bytes, and size checks all present." });
  }
  return findings;
}

function checkEnvDefaults() {
  const findings = [];
  const content = readSafe(path.join(PROJECT_ROOT, ".env.example"));
  if (!content) {
    findings.push({ id: "SEC-005", severity: "LOW", title: "No .env.example file", description: "Consider adding one for documentation." });
    return findings;
  }
  const sensitivePatterns = [
    { regex: /NEXTAUTH_SECRET=(?!your-)(?!change-).+/, label: "NEXTAUTH_SECRET has a real value" },
    { regex: /AZURE_STORAGE_CONNECTION_STRING=(?!your-)(?!DefaultEndpoints).+/, label: "Azure storage connection string looks real" },
  ];
  for (const p of sensitivePatterns) {
    if (p.regex.test(content)) {
      findings.push({ id: "SEC-005", severity: "HIGH", title: p.label, file: ".env.example", description: "Sensitive default in .env.example could leak credentials.", recommendation: "Use placeholder values like 'your-secret-here'." });
    }
  }
  // Check for the old wrong domain
  if (content.includes("alexmorgan.dev")) {
    findings.push({ id: "SEC-005", severity: "LOW", title: ".env.example has placeholder domain from template", file: ".env.example", description: "Still using template author's domain.", recommendation: "Replace with your-domain.com or actual domain." });
  }
  if (findings.length === 0) {
    findings.push({ id: "SEC-005", severity: "INFO", title: ".env.example has safe defaults", description: "No sensitive values found in .env.example." });
  }
  return findings;
}

function checkPathTraversal() {
  const findings = [];
  const adminFile = readSafe(path.join(PROJECT_ROOT, "lib", "admin.ts"));
  if (adminFile && !adminFile.includes("sanitizeSlug")) {
    findings.push({ id: "SEC-001", severity: "CRITICAL", title: "No slug sanitization in admin CRUD", file: "lib/admin.ts", description: "Admin save/delete functions don't validate slugs, allowing path traversal.", recommendation: "Add sanitizeSlug() helper and call it in every save/delete function." });
  } else if (adminFile) {
    findings.push({ id: "SEC-001", severity: "INFO", title: "Admin CRUD has slug sanitization", description: "sanitizeSlug() is used in lib/admin.ts." });
  }
  return findings;
}

function checkCSP() {
  const findings = [];
  const content = readSafe(path.join(PROJECT_ROOT, "next.config.ts"));
  if (content && !content.includes("Content-Security-Policy")) {
    findings.push({ id: "SEC-006", severity: "MEDIUM", title: "Missing Content-Security-Policy header", file: "next.config.ts", description: "CSP helps prevent XSS and data injection attacks.", recommendation: "Add a Content-Security-Policy header to next.config.ts headers()." });
  } else if (content) {
    findings.push({ id: "SEC-006", severity: "INFO", title: "Content-Security-Policy is configured", description: "CSP header present." });
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Performance Checks
// ---------------------------------------------------------------------------

function checkForceDynamic() {
  const findings = [];
  const files = findFiles(path.join(PROJECT_ROOT, "app"), [".tsx", ".ts"]);
  for (const f of files) {
    if (f.includes("admin")) continue; // admin is expected to be dynamic
    const content = readSafe(f);
    if (!content) continue;
    if (content.includes('dynamic = "force-dynamic"') || content.includes("dynamic = 'force-dynamic'")) {
      findings.push({ id: "PERF-001", severity: "HIGH", title: "Public page uses force-dynamic", file: rel(f), description: "force-dynamic disables all caching. Use revalidate for ISR instead.", recommendation: "Replace with export const revalidate = 60;" });
    }
  }
  if (findings.length === 0) {
    findings.push({ id: "PERF-001", severity: "INFO", title: "No public pages use force-dynamic", description: "All public pages use static generation or ISR." });
  }
  return findings;
}

function checkReactCache() {
  const findings = [];
  const content = readSafe(path.join(PROJECT_ROOT, "lib", "content.ts"));
  if (!content) return findings;
  if (!content.includes('from "react"') && !content.includes("from 'react'")) {
    findings.push({ id: "PERF-002", severity: "MEDIUM", title: "React.cache() not imported in lib/content.ts", file: "lib/content.ts", description: "Data fetchers should use React.cache() for request deduplication.", recommendation: "Import { cache } from 'react' and wrap exported getters." });
    return findings;
  }
  // Check specific functions
  const getters = ["getProfile", "getProjects", "getCertifications", "getEvents", "getTalks", "getAllBlogPosts", "getAllCaseStudies"];
  for (const fn of getters) {
    const cachePattern = new RegExp(`(const|let)\\s+${fn}\\s*=\\s*cache\\(`);
    if (!cachePattern.test(content)) {
      const fnPattern = new RegExp(`function\\s+${fn}\\s*\\(`);
      if (fnPattern.test(content)) {
        findings.push({ id: "PERF-002", severity: "LOW", title: `${fn}() not wrapped in React.cache()`, file: "lib/content.ts", description: `${fn} is called multiple times per render but not deduplicated.`, recommendation: `Wrap with: export const ${fn} = cache(function ${fn}() { ... });` });
      }
    }
  }
  if (findings.length === 0) {
    findings.push({ id: "PERF-002", severity: "INFO", title: "Data fetchers use React.cache()", description: "All major getters are wrapped in cache()." });
  }
  return findings;
}

function checkImgTags() {
  const findings = [];
  // Only check public pages, not admin
  const files = findFiles(path.join(PROJECT_ROOT, "app"), [".tsx"]).filter((f) => !f.includes("admin"));
  const componentFiles = findFiles(path.join(PROJECT_ROOT, "components"), [".tsx"]).filter((f) => !f.includes("admin"));
  for (const f of [...files, ...componentFiles]) {
    const content = readSafe(f);
    if (!content) continue;
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/<img\s/) && !lines[i].includes("// eslint-disable")) {
        findings.push({
          id: "PERF-003", severity: "MEDIUM",
          title: "Raw <img> tag instead of next/image",
          file: rel(f), line: i + 1,
          description: "next/image provides automatic optimization, lazy loading, and responsive sizing.",
          recommendation: "Replace <img> with <Image> from next/image.",
          codeSnippet: lines[i].trim().substring(0, 100),
        });
      }
    }
  }
  if (findings.length === 0) {
    findings.push({ id: "PERF-003", severity: "INFO", title: "All images use next/image", description: "No raw <img> tags in public pages." });
  }
  return findings;
}

function checkLazyLoading() {
  const findings = [];
  const files = findFiles(path.join(PROJECT_ROOT, "app"), [".tsx"]).filter((f) => !f.includes("admin"));
  for (const f of files) {
    const content = readSafe(f);
    if (!content) continue;
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/<img\s/) && !lines[i].includes('loading=')) {
        findings.push({
          id: "PERF-004", severity: "LOW",
          title: "Image missing loading attribute",
          file: rel(f), line: i + 1,
          description: "Add loading=\"lazy\" for offscreen images.",
          codeSnippet: lines[i].trim().substring(0, 100),
        });
      }
    }
  }
  if (findings.length === 0) {
    findings.push({ id: "PERF-004", severity: "INFO", title: "All images have lazy loading", description: "Loading attributes present on all img tags." });
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Accessibility Checks
// ---------------------------------------------------------------------------

function checkAriaLabels() {
  const findings = [];
  const files = [
    ...findFiles(path.join(PROJECT_ROOT, "app"), [".tsx"]).filter((f) => !f.includes("admin")),
    ...findFiles(path.join(PROJECT_ROOT, "components"), [".tsx"]).filter((f) => !f.includes("admin")),
  ];
  for (const f of files) {
    const content = readSafe(f);
    if (!content) continue;
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      // Icon-only links/buttons (have an icon component but no visible text)
      if (lines[i].match(/<(a|button|Link)\s/) && !lines[i].includes("aria-label") && !lines[i].includes("aria-labelledby")) {
        // Check if the next 3 lines have text content or just an icon
        const context = lines.slice(i, Math.min(lines.length, i + 4)).join(" ");
        const hasIcon = context.match(/<\w+.*className.*w-[45].*h-[45]/);
        const hasTextContent = context.match(/>[^<{]+</);
        if (hasIcon && !hasTextContent) {
          findings.push({
            id: "A11Y-001", severity: "MEDIUM",
            title: "Icon-only interactive element without aria-label",
            file: rel(f), line: i + 1,
            description: "Icon-only links/buttons need aria-label for screen readers.",
            recommendation: "Add aria-label describing the action.",
          });
        }
      }
    }
  }
  if (findings.length === 0) {
    findings.push({ id: "A11Y-001", severity: "INFO", title: "Interactive elements have proper labels", description: "All icon-only elements have aria-labels." });
  }
  return findings;
}

function checkAltText() {
  const findings = [];
  const files = [
    ...findFiles(path.join(PROJECT_ROOT, "app"), [".tsx"]).filter((f) => !f.includes("admin")),
    ...findFiles(path.join(PROJECT_ROOT, "components"), [".tsx"]).filter((f) => !f.includes("admin")),
  ];
  for (const f of files) {
    const content = readSafe(f);
    if (!content) continue;
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].match(/<(img|Image)\s/) && !lines[i].includes("alt=") && !lines[i].includes("alt =")) {
        // Check next 3 lines for alt attribute
        const context = lines.slice(i, Math.min(lines.length, i + 4)).join(" ");
        if (!context.includes("alt=") && !context.includes("alt =")) {
          findings.push({
            id: "A11Y-002", severity: "MEDIUM",
            title: "Image missing alt attribute",
            file: rel(f), line: i + 1,
            description: "All images should have alt text for screen readers.",
            recommendation: "Add a descriptive alt attribute.",
          });
        }
      }
    }
  }
  if (findings.length === 0) {
    findings.push({ id: "A11Y-002", severity: "INFO", title: "All images have alt text", description: "Every image has an alt attribute." });
  }
  return findings;
}

function checkSkipLink() {
  const findings = [];
  const layout = readSafe(path.join(PROJECT_ROOT, "app", "layout.tsx"));
  if (!layout) return findings;
  if (!layout.includes("skip") && !layout.includes("Skip")) {
    findings.push({ id: "A11Y-003", severity: "MEDIUM", title: "No skip-to-content link in layout", file: "app/layout.tsx", description: "Users navigating with keyboard need a skip link to bypass navigation.", recommendation: 'Add <a href="#main-content" className="sr-only focus:not-sr-only">Skip to content</a> at the top of the body.' });
  } else {
    // Check if the target id exists
    if (layout.includes('id="main-content"') || layout.includes("id='main-content'")) {
      findings.push({ id: "A11Y-003", severity: "INFO", title: "Skip-to-content link properly implemented", description: "Skip link and target ID both present." });
    } else {
      findings.push({ id: "A11Y-003", severity: "LOW", title: "Skip link exists but may target missing ID", file: "app/layout.tsx", description: "Verify the skip link target element exists.", recommendation: 'Ensure a main element with id="main-content" exists.' });
    }
  }
  return findings;
}

function checkAriaHidden() {
  const findings = [];
  const files = findFiles(path.join(PROJECT_ROOT, "app"), [".tsx"]).filter((f) => !f.includes("admin"));
  let totalIcons = 0;
  let missingAriaHidden = 0;
  for (const f of files) {
    const content = readSafe(f);
    if (!content) continue;
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      // Match Lucide icon components (e.g., <ArrowLeft className="w-4 h-4" />)
      if (lines[i].match(/<[A-Z]\w+\s+className="[^"]*w-[345]\s+h-[345][^"]*"/)) {
        totalIcons++;
        if (!lines[i].includes('aria-hidden')) {
          missingAriaHidden++;
        }
      }
    }
  }
  if (missingAriaHidden > 0) {
    findings.push({ id: "A11Y-004", severity: "LOW", title: `${missingAriaHidden}/${totalIcons} decorative icons missing aria-hidden`, description: "Decorative icons should have aria-hidden=\"true\" to hide from screen readers.", recommendation: 'Add aria-hidden="true" to all decorative icon components.' });
  } else {
    findings.push({ id: "A11Y-004", severity: "INFO", title: "Decorative icons properly hidden from screen readers", description: `All ${totalIcons} icon instances have aria-hidden.` });
  }
  return findings;
}

// ---------------------------------------------------------------------------
// SEO Checks
// ---------------------------------------------------------------------------

function checkCanonicalTags() {
  const findings = [];
  const pageFiles = findFiles(path.join(PROJECT_ROOT, "app"), [".tsx"]).filter(
    (f) => f.endsWith("page.tsx") && !f.includes("admin") && !f.includes("api")
  );
  for (const f of pageFiles) {
    const content = readSafe(f);
    if (!content) continue;
    // Check for canonical in metadata or generateMetadata
    if (!content.includes("canonical")) {
      findings.push({
        id: "SEO-001", severity: "LOW",
        title: "Missing canonical tag",
        file: rel(f),
        description: "Page does not set a canonical URL in metadata.",
        recommendation: "Add alternates: { canonical: '/path' } to the page metadata.",
      });
    }
  }
  // Check root layout
  const layout = readSafe(path.join(PROJECT_ROOT, "app", "layout.tsx"));
  if (layout && !layout.includes("canonical")) {
    findings.push({ id: "SEO-001", severity: "MEDIUM", title: "Root layout missing canonical", file: "app/layout.tsx", description: "The root layout should set a default canonical URL." });
  }
  if (findings.length === 0) {
    findings.push({ id: "SEO-001", severity: "INFO", title: "All pages have canonical tags", description: "Canonical URLs properly set." });
  }
  return findings;
}

function checkJsonLd() {
  const findings = [];
  const jsonLd = readSafe(path.join(PROJECT_ROOT, "components", "JsonLd.tsx"));
  if (!jsonLd) {
    findings.push({ id: "SEO-002", severity: "HIGH", title: "No JSON-LD schema component found", description: "Missing structured data." });
    return findings;
  }
  const schemas = ["PersonSchema", "WebSiteSchema", "BlogPostSchema", "CaseStudySchema"];
  for (const s of schemas) {
    if (!jsonLd.includes(`function ${s}`)) {
      findings.push({ id: "SEO-002", severity: "MEDIUM", title: `Missing ${s} in JsonLd.tsx`, file: "components/JsonLd.tsx", description: `${s} schema not found.` });
    }
  }
  // Check if BlogPostSchema includes image
  if (jsonLd.includes("BlogPostSchema") && !jsonLd.includes("coverImage")) {
    findings.push({ id: "SEO-002", severity: "LOW", title: "BlogPosting schema missing image property", file: "components/JsonLd.tsx", description: "Blog posts should include an image in JSON-LD." });
  }
  if (findings.length === 0) {
    findings.push({ id: "SEO-002", severity: "INFO", title: "JSON-LD schemas complete", description: "All required schemas present with proper properties." });
  }
  return findings;
}

function checkOpenGraph() {
  const findings = [];
  const layout = readSafe(path.join(PROJECT_ROOT, "app", "layout.tsx"));
  if (layout && !layout.includes("openGraph")) {
    findings.push({ id: "SEO-003", severity: "MEDIUM", title: "Root layout missing OpenGraph tags", file: "app/layout.tsx" });
  }
  if (layout && !layout.includes("twitter")) {
    findings.push({ id: "SEO-003", severity: "LOW", title: "Root layout missing Twitter card tags", file: "app/layout.tsx" });
  }
  if (findings.length === 0) {
    findings.push({ id: "SEO-003", severity: "INFO", title: "OpenGraph and Twitter tags present", description: "Social media metadata properly configured." });
  }
  return findings;
}

function checkSitemapCompleteness() {
  const findings = [];
  const sitemap = readSafe(path.join(PROJECT_ROOT, "app", "sitemap.ts"));
  if (!sitemap) {
    findings.push({ id: "SEO-004", severity: "HIGH", title: "No sitemap.ts found", description: "Missing XML sitemap." });
    return findings;
  }
  const expectedRoutes = ["/blog", "/case-studies", "/projects", "/events", "/talks", "/resume", "/social"];
  for (const route of expectedRoutes) {
    if (!sitemap.includes(route)) {
      findings.push({ id: "SEO-004", severity: "MEDIUM", title: `Sitemap missing route: ${route}`, file: "app/sitemap.ts", description: `${route} is not in the sitemap.` });
    }
  }
  if (findings.length === 0) {
    findings.push({ id: "SEO-004", severity: "INFO", title: "Sitemap covers all routes", description: "All public routes are in the sitemap." });
  }
  return findings;
}

function checkRobots() {
  const findings = [];
  const robots = readSafe(path.join(PROJECT_ROOT, "app", "robots.ts"));
  if (!robots) {
    findings.push({ id: "SEO-005", severity: "MEDIUM", title: "No robots.ts found", description: "Missing robots.txt configuration." });
    return findings;
  }
  if (!robots.includes("/admin/")) {
    findings.push({ id: "SEO-005", severity: "MEDIUM", title: "robots.txt not blocking /admin/", file: "app/robots.ts" });
  }
  if (!robots.includes("/api/")) {
    findings.push({ id: "SEO-005", severity: "LOW", title: "robots.txt not blocking /api/", file: "app/robots.ts" });
  }
  if (findings.length === 0) {
    findings.push({ id: "SEO-005", severity: "INFO", title: "robots.txt properly configured", description: "Admin and API routes blocked from crawlers." });
  }
  return findings;
}

function checkSiteURL() {
  const findings = [];
  const constants = readSafe(path.join(PROJECT_ROOT, "lib", "constants.ts"));
  if (!constants || !constants.includes("SITE_URL")) {
    findings.push({ id: "SEO-006", severity: "MEDIUM", title: "No SITE_URL constant defined", file: "lib/constants.ts", description: "Centralize site URL to avoid hardcoded domains." });
    return findings;
  }
  // Check for hardcoded domain in files that should use SITE_URL
  const filesToCheck = ["app/sitemap.ts", "app/robots.ts", "app/layout.tsx", "components/JsonLd.tsx"];
  for (const f of filesToCheck) {
    const content = readSafe(path.join(PROJECT_ROOT, f));
    if (content && content.includes("sauravraghuvanshi.dev") && !f.includes("constants")) {
      findings.push({ id: "SEO-006", severity: "LOW", title: `Hardcoded domain instead of SITE_URL`, file: f, description: "Should import SITE_URL from lib/constants.ts instead." });
    }
  }
  if (findings.length === 0) {
    findings.push({ id: "SEO-006", severity: "INFO", title: "SITE_URL used consistently", description: "All SEO files reference the centralized constant." });
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Architecture Checks
// ---------------------------------------------------------------------------

function checkConsistentGuards() {
  const findings = [];
  const content = readSafe(path.join(PROJECT_ROOT, "lib", "content.ts"));
  if (!content) return findings;
  // Check that every exported function reading JSON has existsSync
  const fnMatches = content.matchAll(/(?:export\s+(?:const|function)\s+)(\w+)/g);
  for (const m of fnMatches) {
    const fnName = m[1];
    // Find the function body
    const fnStart = content.indexOf(m[0]);
    const fnBody = content.substring(fnStart, fnStart + 500);
    if (fnBody.includes("readFileSync") && !fnBody.includes("existsSync")) {
      findings.push({ id: "ARCH-001", severity: "MEDIUM", title: `${fnName}() reads file without existsSync guard`, file: "lib/content.ts", description: "Inconsistent with the project pattern of checking existence before reading." });
    }
  }
  if (findings.length === 0) {
    findings.push({ id: "ARCH-001", severity: "INFO", title: "Consistent existsSync guard pattern", description: "All file-reading functions in lib/content.ts check existence first." });
  }
  return findings;
}

function checkFileSizes() {
  const findings = [];
  const files = [
    ...findFiles(path.join(PROJECT_ROOT, "app"), [".tsx", ".ts"]),
    ...findFiles(path.join(PROJECT_ROOT, "components"), [".tsx"]),
    ...findFiles(path.join(PROJECT_ROOT, "lib"), [".ts"]),
  ];
  const large = [];
  for (const f of files) {
    const content = readSafe(f);
    if (!content) continue;
    const lines = lineCount(content);
    if (lines > 200) large.push({ file: rel(f), lines });
  }
  large.sort((a, b) => b.lines - a.lines);
  if (large.length > 0) {
    const table = large.map((l) => `${l.file}: ${l.lines} lines`).join("\n");
    findings.push({ id: "ARCH-002", severity: "INFO", title: `${large.length} files over 200 lines`, description: `Largest files:\n${table}` });
  }
  return findings;
}

function checkDependencyHealth() {
  const findings = [];
  try {
    const output = execSync("npm outdated --json", { cwd: PROJECT_ROOT, timeout: 15000, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
    const outdated = JSON.parse(output || "{}");
    const keys = Object.keys(outdated);
    if (keys.length === 0) {
      findings.push({ id: "ARCH-003", severity: "INFO", title: "All dependencies up to date", description: "No outdated packages found." });
    } else {
      const majorUpdates = keys.filter((k) => {
        const pkg = outdated[k];
        const cur = (pkg.current || "").split(".")[0];
        const lat = (pkg.latest || "").split(".")[0];
        return cur !== lat;
      });
      if (majorUpdates.length > 0) {
        findings.push({ id: "ARCH-003", severity: "LOW", title: `${majorUpdates.length} packages have major updates available`, description: majorUpdates.map((k) => `${k}: ${outdated[k].current} → ${outdated[k].latest}`).join("\n") });
      }
      if (keys.length > majorUpdates.length) {
        findings.push({ id: "ARCH-003", severity: "INFO", title: `${keys.length - majorUpdates.length} packages have minor/patch updates`, description: "Run npm update to apply safe updates." });
      }
    }
  } catch {
    // npm outdated exits with code 1 when packages are outdated
    try {
      const output = execSync("npm outdated --json 2>&1", { cwd: PROJECT_ROOT, timeout: 15000, encoding: "utf-8" });
      if (output.trim()) {
        const outdated = JSON.parse(output);
        const keys = Object.keys(outdated);
        findings.push({ id: "ARCH-003", severity: "INFO", title: `${keys.length} packages have updates available`, description: keys.slice(0, 10).map((k) => `${k}: ${outdated[k].current} → ${outdated[k].latest}`).join("\n") });
      }
    } catch {
      findings.push({ id: "ARCH-003", severity: "INFO", title: "Dependency check skipped", description: "Could not run npm outdated." });
    }
  }
  return findings;
}

function checkAPIRouteConsistency() {
  const findings = [];
  const apiDir = path.join(PROJECT_ROOT, "app", "api", "admin");
  const routes = findFiles(apiDir, [".ts"]);
  let missingAuth = 0;
  let missingTryCatch = 0;
  for (const f of routes) {
    const content = readSafe(f);
    if (!content) continue;
    if (!content.includes("auth(") && !content.includes("session")) {
      missingAuth++;
      findings.push({ id: "ARCH-004", severity: "HIGH", title: "Admin API route missing auth check", file: rel(f), description: "This admin route does not verify the user is authenticated." });
    }
    // Check each handler has try-catch
    const handlers = content.match(/export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)/g) || [];
    for (const h of handlers) {
      const method = h.split(/\s+/).pop();
      const handlerStart = content.indexOf(h);
      const handlerBody = content.substring(handlerStart, handlerStart + 1000);
      if (!handlerBody.includes("try {") && !handlerBody.includes("try{")) {
        findings.push({ id: "ARCH-004", severity: "LOW", title: `${method} handler missing try-catch`, file: rel(f), description: "API handlers should wrap operations in try-catch for error handling." });
      }
    }
  }
  if (findings.length === 0) {
    findings.push({ id: "ARCH-004", severity: "INFO", title: "API routes follow consistent patterns", description: "All routes have auth checks and error handling." });
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Content Freshness Checks
// ---------------------------------------------------------------------------

function checkEmptyContent() {
  const findings = [];
  const mdxFiles = [
    ...findFiles(path.join(PROJECT_ROOT, "content", "blog"), [".mdx"]),
    ...findFiles(path.join(PROJECT_ROOT, "content", "case-studies"), [".mdx"]),
  ];
  for (const f of mdxFiles) {
    const content = readSafe(f);
    if (!content) continue;
    // Check if there's content after frontmatter
    const parts = content.split("---");
    if (parts.length >= 3) {
      const body = parts.slice(2).join("---").trim();
      if (body.length < 50) {
        findings.push({ id: "CONT-001", severity: "MEDIUM", title: "Content file with minimal body", file: rel(f), description: `Only ${body.length} characters of content after frontmatter.`, recommendation: "Add meaningful content or mark as draft." });
      }
    }
  }
  if (findings.length === 0) {
    findings.push({ id: "CONT-001", severity: "INFO", title: "All content files have substantial content", description: "No empty or near-empty MDX files." });
  }
  return findings;
}

function checkBlogCoverImages() {
  const findings = [];
  const files = findFiles(path.join(PROJECT_ROOT, "content", "blog"), [".mdx"]);
  for (const f of files) {
    const content = readSafe(f);
    if (!content) continue;
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) continue;
    const fm = fmMatch[1];
    if (!fm.includes("coverImage") || fm.match(/coverImage:\s*["']?\s*["']?\s*$/m)) {
      findings.push({ id: "CONT-002", severity: "LOW", title: "Blog post without cover image", file: rel(f), description: "Posts with cover images get better social media engagement.", recommendation: "Add a coverImage to the frontmatter." });
    }
  }
  if (findings.length === 0) {
    findings.push({ id: "CONT-002", severity: "INFO", title: "All blog posts have cover images", description: "Every post has a coverImage set." });
  }
  return findings;
}

function checkCertBadges() {
  const findings = [];
  const certs = readJSON(path.join(PROJECT_ROOT, "content", "certifications.json"));
  if (!certs || !Array.isArray(certs)) return findings;
  for (const cert of certs) {
    if (!cert.badge || cert.badge === "#" || cert.badge === "") {
      findings.push({ id: "CONT-003", severity: "LOW", title: `Certification "${cert.code}" has no badge image`, file: "content/certifications.json", description: "Badge images help visual recognition.", recommendation: "Upload a badge image via the admin portal." });
    }
  }
  if (findings.length === 0) {
    findings.push({ id: "CONT-003", severity: "INFO", title: "All certifications have badge images", description: "Every certification has a badge URL set." });
  }
  return findings;
}

function checkCertVerifyURLs() {
  const findings = [];
  const certs = readJSON(path.join(PROJECT_ROOT, "content", "certifications.json"));
  if (!certs || !Array.isArray(certs)) return findings;
  const placeholders = certs.filter((c) => !c.verifyUrl || c.verifyUrl === "#");
  if (placeholders.length > 0) {
    findings.push({ id: "CONT-004", severity: "LOW", title: `${placeholders.length} certifications have placeholder verify URLs`, file: "content/certifications.json", description: `Certifications with "#" as verifyUrl: ${placeholders.map((c) => c.code).join(", ")}`, recommendation: "Add actual Credly/Microsoft verification URLs." });
  } else {
    findings.push({ id: "CONT-004", severity: "INFO", title: "All certifications have verify URLs", description: "Every certification links to a verification page." });
  }
  return findings;
}

function checkEventImagePaths() {
  const findings = [];
  const events = readJSON(path.join(PROJECT_ROOT, "content", "events.json"));
  if (!events || !Array.isArray(events)) return findings;
  let staleCount = 0;
  for (const event of events) {
    const images = [...(event.images || []), event.coverImage].filter(Boolean);
    for (const img of images) {
      if (img.startsWith("/events/") || img.startsWith("/public/")) {
        staleCount++;
      }
    }
  }
  if (staleCount > 0) {
    findings.push({ id: "CONT-005", severity: "MEDIUM", title: `${staleCount} event images still use local paths`, file: "content/events.json", description: "Images should use Azure Blob Storage URLs after migration.", recommendation: "Re-run the image migration script or update paths manually." });
  } else {
    findings.push({ id: "CONT-005", severity: "INFO", title: "All event images use blob storage URLs", description: "No stale local image paths in events.json." });
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Check Registry
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { name: "Code Quality & Bugs", id: "cq", checks: [checkMDXTryCatch, checkJSONParseTryCatch, checkExistsSyncGuards, checkConsoleLog, checkLargeFiles, checkHardcodedValues] },
  { name: "Security", id: "security", checks: [checkPathTraversal, checkSecurityHeaders, checkDangerousHTML, checkUploadMIME, checkEnvDefaults, checkCSP] },
  { name: "Performance", id: "perf", checks: [checkForceDynamic, checkReactCache, checkImgTags, checkLazyLoading] },
  { name: "Accessibility", id: "a11y", checks: [checkAriaLabels, checkAltText, checkSkipLink, checkAriaHidden] },
  { name: "SEO & Meta", id: "seo", checks: [checkCanonicalTags, checkJsonLd, checkOpenGraph, checkSitemapCompleteness, checkRobots, checkSiteURL] },
  { name: "Architecture", id: "arch", checks: [checkConsistentGuards, checkFileSizes, checkDependencyHealth, checkAPIRouteConsistency] },
  { name: "Content Freshness", id: "content", checks: [checkEmptyContent, checkBlogCoverImages, checkCertBadges, checkCertVerifyURLs, checkEventImagePaths] },
];

// ---------------------------------------------------------------------------
// Grading Engine
// ---------------------------------------------------------------------------

function computeGrade(findings) {
  const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
  for (const f of findings) counts[f.severity] = (counts[f.severity] || 0) + 1;
  let score = 100;
  score -= counts.CRITICAL * 15;
  score -= counts.HIGH * 8;
  score -= counts.MEDIUM * 4;
  score -= Math.ceil(counts.LOW * 0.5);
  score = Math.max(0, Math.min(100, score));
  let grade, label;
  if (score >= 93) { grade = "A"; label = "Excellent"; }
  else if (score >= 85) { grade = "A-"; label = "Very Good"; }
  else if (score >= 80) { grade = "B+"; label = "Good"; }
  else if (score >= 73) { grade = "B"; label = "Solid"; }
  else if (score >= 65) { grade = "C+"; label = "Fair"; }
  else if (score >= 55) { grade = "C"; label = "Needs Work"; }
  else if (score >= 45) { grade = "D"; label = "Below Average"; }
  else { grade = "F"; label = "Critical Issues"; }
  return { grade, score, label, counts };
}

// ---------------------------------------------------------------------------
// HTML Generator
// ---------------------------------------------------------------------------

function escapeHTML(str) {
  return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function generateHTML(groupedFindings, grade, timestamp) {
  const allFindings = groupedFindings.flatMap((g) => g.findings);
  const nonInfo = allFindings.filter((f) => f.severity !== "INFO");

  const css = `
    :root { --bg: #0f172a; --card: #1e293b; --border: #334155; --text: #e2e8f0; --muted: #94a3b8; --red: #ef4444; --orange: #f97316; --yellow: #eab308; --blue: #3b82f6; --green: #22c55e; --purple: #a855f7; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; padding: 2rem; }
    .container { max-width: 1100px; margin: 0 auto; }
    .header { text-align: center; padding: 2rem 0 1.5rem; border-bottom: 1px solid var(--border); margin-bottom: 2rem; }
    .header h1 { font-size: 1.8rem; margin-bottom: 0.3rem; }
    .header .subtitle { color: var(--muted); font-size: 0.95rem; }
    .header .meta { margin-top: 1rem; display: flex; justify-content: center; gap: 2rem; color: var(--muted); font-size: 0.85rem; }
    .grade-badge { display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; border-radius: 50%; font-size: 1.6rem; font-weight: 800; margin: 1rem auto 0.5rem; }
    .grade-A { background: rgba(34,197,94,0.15); color: var(--green); border: 2px solid var(--green); }
    .grade-B { background: rgba(59,130,246,0.15); color: var(--blue); border: 2px solid var(--blue); }
    .grade-C { background: rgba(234,179,8,0.15); color: var(--yellow); border: 2px solid var(--yellow); }
    .grade-D { background: rgba(249,115,22,0.15); color: var(--orange); border: 2px solid var(--orange); }
    .grade-F { background: rgba(239,68,68,0.15); color: var(--red); border: 2px solid var(--red); }
    .grade-label { font-size: 0.9rem; color: var(--muted); }
    .score-strip { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; margin-bottom: 2rem; }
    .score-chip { padding: 0.4rem 1rem; border-radius: 999px; font-size: 0.8rem; font-weight: 600; }
    .chip-critical { background: rgba(239,68,68,0.15); color: #fca5a5; border: 1px solid rgba(239,68,68,0.3); }
    .chip-high { background: rgba(249,115,22,0.15); color: #fdba74; border: 1px solid rgba(249,115,22,0.3); }
    .chip-medium { background: rgba(234,179,8,0.1); color: #fde047; border: 1px solid rgba(234,179,8,0.25); }
    .chip-low { background: rgba(59,130,246,0.12); color: #93c5fd; border: 1px solid rgba(59,130,246,0.3); }
    .chip-info { background: rgba(168,85,247,0.12); color: #d8b4fe; border: 1px solid rgba(168,85,247,0.3); }
    .toc { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem; margin-bottom: 2rem; }
    .toc a { display: block; padding: 0.6rem 1rem; background: var(--card); border: 1px solid var(--border); border-radius: 8px; color: var(--text); text-decoration: none; font-size: 0.85rem; transition: border-color 0.2s; }
    .toc a:hover { border-color: var(--blue); }
    .section { margin-bottom: 2rem; }
    .section-hdr { padding: 1rem 1.25rem; background: var(--card); border: 1px solid var(--border); border-radius: 10px 10px 0 0; }
    .section-hdr h2 { font-size: 1.15rem; }
    .section-body { border: 1px solid var(--border); border-top: none; border-radius: 0 0 10px 10px; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .finding { border-left: 4px solid var(--border); border-radius: 8px; padding: 0.85rem 1rem; background: rgba(30,41,59,0.5); }
    .finding-hdr { display: flex; align-items: flex-start; gap: 0.7rem; margin-bottom: 0.4rem; }
    .tag { padding: 0.15rem 0.55rem; border-radius: 4px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; white-space: nowrap; }
    .tag-critical { background: rgba(239,68,68,0.2); color: #fca5a5; }
    .tag-high { background: rgba(249,115,22,0.2); color: #fdba74; }
    .tag-medium { background: rgba(234,179,8,0.15); color: #fde047; }
    .tag-low { background: rgba(59,130,246,0.15); color: #93c5fd; }
    .tag-info { background: rgba(168,85,247,0.15); color: #d8b4fe; }
    .sev-critical { border-left-color: var(--red); }
    .sev-high { border-left-color: var(--orange); }
    .sev-medium { border-left-color: var(--yellow); }
    .sev-low { border-left-color: var(--blue); }
    .sev-info { border-left-color: var(--purple); }
    .finding-title { font-weight: 600; font-size: 0.9rem; }
    .finding-loc { font-size: 0.78rem; color: var(--muted); font-family: monospace; }
    .finding-body { font-size: 0.85rem; color: var(--muted); }
    .finding-body p { margin-bottom: 0.3rem; }
    .finding-rec { color: var(--green); font-size: 0.82rem; margin-top: 0.3rem; }
    pre.code { background: rgba(0,0,0,0.3); padding: 0.6rem 0.8rem; border-radius: 6px; overflow-x: auto; font-size: 0.78rem; margin: 0.4rem 0; border-left: 3px solid var(--border); }
    .footer { text-align: center; padding: 2rem 0 1rem; color: var(--muted); font-size: 0.8rem; border-top: 1px solid var(--border); margin-top: 2rem; }
  `;

  const gradeClass = grade.grade.startsWith("A") ? "grade-A" : grade.grade.startsWith("B") ? "grade-B" : grade.grade.startsWith("C") ? "grade-C" : grade.grade.startsWith("D") ? "grade-D" : "grade-F";

  const header = `
    <div class="header">
      <h1>Portfolio Website — Audit Report</h1>
      <div class="subtitle">Automated static code analysis — ${timestamp}</div>
      <div class="grade-badge ${gradeClass}">${escapeHTML(grade.grade)}</div>
      <div class="grade-label">${grade.score}/100 — ${escapeHTML(grade.label)}</div>
      <div class="meta">
        <span>Findings: ${nonInfo.length} (${allFindings.length} total incl. passing)</span>
        <span>Categories: ${groupedFindings.length}</span>
        <span>Checks: ${groupedFindings.reduce((s, g) => s + g.findings.length, 0)}</span>
      </div>
    </div>`;

  const strip = `
    <div class="score-strip">
      <span class="score-chip chip-critical">Critical: ${grade.counts.CRITICAL || 0}</span>
      <span class="score-chip chip-high">High: ${grade.counts.HIGH || 0}</span>
      <span class="score-chip chip-medium">Medium: ${grade.counts.MEDIUM || 0}</span>
      <span class="score-chip chip-low">Low: ${grade.counts.LOW || 0}</span>
      <span class="score-chip chip-info">Passing: ${grade.counts.INFO || 0}</span>
    </div>`;

  const toc = `
    <div class="toc">
      ${groupedFindings.map((g, i) => `<a href="#section-${g.id}">${i + 1}. ${escapeHTML(g.name)}</a>`).join("\n      ")}
    </div>`;

  const sections = groupedFindings.map((g, i) => {
    const cards = g.findings.map((f) => {
      const sevClass = `sev-${f.severity.toLowerCase()}`;
      const tagClass = `tag-${f.severity.toLowerCase()}`;
      return `
        <div class="finding ${sevClass}">
          <div class="finding-hdr">
            <span class="tag ${tagClass}">${f.severity}</span>
            <div>
              <div class="finding-title">${escapeHTML(f.id)}: ${escapeHTML(f.title)}</div>
              ${f.file ? `<div class="finding-loc">${escapeHTML(f.file)}${f.line ? `:${f.line}` : ""}</div>` : ""}
            </div>
          </div>
          <div class="finding-body">
            ${f.description ? `<p>${escapeHTML(f.description)}</p>` : ""}
            ${f.codeSnippet ? `<pre class="code"><code>${escapeHTML(f.codeSnippet)}</code></pre>` : ""}
            ${f.recommendation ? `<div class="finding-rec">→ ${escapeHTML(f.recommendation)}</div>` : ""}
          </div>
        </div>`;
    }).join("");

    return `
      <div class="section" id="section-${g.id}">
        <div class="section-hdr"><h2>${i + 1}. ${escapeHTML(g.name)}</h2></div>
        <div class="section-body">${cards}</div>
      </div>`;
  }).join("");

  const footer = `
    <div class="footer">
      Portfolio Audit Report — Generated by scripts/audit.mjs<br>
      Static code analysis of ${findFiles(path.join(PROJECT_ROOT, "app"), [".ts", ".tsx"]).length + findFiles(path.join(PROJECT_ROOT, "components"), [".tsx"]).length + findFiles(path.join(PROJECT_ROOT, "lib"), [".ts"]).length} source files | ${timestamp}
    </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portfolio Audit Report — ${escapeHTML(timestamp)}</title>
  <style>${css}</style>
</head>
<body>
  <div class="container">
    ${header}
    ${strip}
    ${toc}
    ${sections}
    ${footer}
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const startTime = Date.now();
  console.log("[audit] Starting portfolio audit...");

  const groupedFindings = [];

  for (const category of CATEGORIES) {
    console.log(`[audit]   ${category.name}`);
    const catFindings = [];
    for (const check of category.checks) {
      try {
        const results = check();
        for (const r of results) {
          r.category = category.name;
        }
        catFindings.push(...results);
      } catch (err) {
        catFindings.push({
          id: "ERR", severity: "LOW", category: category.name,
          title: `Check threw an error: ${check.name}`,
          description: err.message,
        });
      }
    }
    groupedFindings.push({ name: category.name, id: category.id, findings: catFindings });
  }

  const allFindings = groupedFindings.flatMap((g) => g.findings);
  const grade = computeGrade(allFindings);
  const timestamp = new Date().toISOString().replace("T", " ").split(".")[0];
  const html = generateHTML(groupedFindings, grade, timestamp);

  if (!fs.existsSync(TASKS_DIR)) fs.mkdirSync(TASKS_DIR, { recursive: true });
  const outputPath = path.join(TASKS_DIR, "audit-report.html");
  fs.writeFileSync(outputPath, html, "utf-8");

  const nonInfo = allFindings.filter((f) => f.severity !== "INFO");
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[audit] Done in ${elapsed}s — Grade: ${grade.grade} (${grade.score}/100)`);
  console.log(`[audit] ${nonInfo.length} findings: ${grade.counts.CRITICAL || 0} critical, ${grade.counts.HIGH || 0} high, ${grade.counts.MEDIUM || 0} medium, ${grade.counts.LOW || 0} low`);
  console.log(`[audit] Report → ${outputPath}`);
}

main();
