// portfolio/scripts/postbuild.mjs
// Copies public/ and .next/static/ into .next/standalone/ after next build.
// Required so the standalone server can serve static assets.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const standaloneDir = path.join(root, ".next", "standalone");
if (!fs.existsSync(standaloneDir)) {
  console.log("[postbuild] No standalone dir found — skipping.");
  process.exit(0);
}

console.log("[postbuild] Copying public/ → .next/standalone/public/");
copyDir(path.join(root, "public"), path.join(standaloneDir, "public"));

console.log("[postbuild] Copying .next/static/ → .next/standalone/.next/static/");
copyDir(path.join(root, ".next", "static"), path.join(standaloneDir, ".next", "static"));

// Copy sync-content.mjs into standalone so it's available at runtime
const syncSrc = path.join(root, "scripts", "sync-content.mjs");
const syncDestDir = path.join(standaloneDir, "scripts");
if (fs.existsSync(syncSrc)) {
  fs.mkdirSync(syncDestDir, { recursive: true });
  fs.copyFileSync(syncSrc, path.join(syncDestDir, "sync-content.mjs"));
  console.log("[postbuild] Copied scripts/sync-content.mjs → .next/standalone/scripts/");
}

console.log("[postbuild] Done.");
