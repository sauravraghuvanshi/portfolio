// portfolio/scripts/generate-events.mjs
// Run with: node scripts/generate-events.mjs (from portfolio/)
// Reads ../../My Events/*.docx + *.jpg  →  content/events.json
//                                       →  public/events/{slug}/*.jpg

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mammoth from "mammoth";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EVENTS_SOURCE  = path.join(__dirname, "..", "..", "My Events");
const OUTPUT_JSON    = path.join(__dirname, "..", "content", "events.json");
const OUTPUT_IMGS    = path.join(__dirname, "..", "public", "events");
const OVERRIDES_FILE = path.join(__dirname, "..", "content", "events-overrides.json");

// Load manual overrides — these win over anything auto-generated
const overrides = fs.existsSync(OVERRIDES_FILE)
  ? JSON.parse(fs.readFileSync(OVERRIDES_FILE, "utf-8"))
  : {};

// ---------------------------------------------------------------------------
// Unicode normalization — Mathematical Bold/Italic ranges to ASCII
// ---------------------------------------------------------------------------
function normalizeMathUnicode(str) {
  return str.replace(/[\u{1D400}-\u{1D7FF}]/gu, (c) => {
    const cp = c.codePointAt(0);
    if (cp >= 0x1d400 && cp <= 0x1d419) return String.fromCharCode(cp - 0x1d400 + 65);  // Bold A-Z
    if (cp >= 0x1d41a && cp <= 0x1d433) return String.fromCharCode(cp - 0x1d41a + 97);  // Bold a-z
    if (cp >= 0x1d434 && cp <= 0x1d44d) return String.fromCharCode(cp - 0x1d434 + 65);  // Italic A-Z
    if (cp >= 0x1d44e && cp <= 0x1d467) return String.fromCharCode(cp - 0x1d44e + 97);  // Italic a-z
    if (cp >= 0x1d468 && cp <= 0x1d481) return String.fromCharCode(cp - 0x1d468 + 65);  // Bold Italic A-Z
    if (cp >= 0x1d482 && cp <= 0x1d49b) return String.fromCharCode(cp - 0x1d482 + 97);  // Bold Italic a-z
    if (cp >= 0x1d5d4 && cp <= 0x1d5ed) return String.fromCharCode(cp - 0x1d5d4 + 65);  // Sans Bold A-Z
    if (cp >= 0x1d5ee && cp <= 0x1d607) return String.fromCharCode(cp - 0x1d5ee + 97);  // Sans Bold a-z
    if (cp >= 0x1d400 && cp <= 0x1d7ff) return "";  // strip other math blocks
    return "";
  });
}

function toSlug(rawName) {
  return normalizeMathUnicode(rawName)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
    .replace(/^-+|-+$/g, "");
}

function stripForMatch(s) {
  return normalizeMathUnicode(s)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

function titleFromBasename(basename) {
  return normalizeMathUnicode(basename)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/[!?🎉]+$/, "")
    .trim();
}

// ---------------------------------------------------------------------------
// Slug deduplication
// ---------------------------------------------------------------------------
const seenSlugs = new Set();
function deduplicateSlug(slug) {
  let candidate = slug || "event";
  let n = 2;
  while (seenSlugs.has(candidate)) candidate = `${slug}-${n++}`;
  seenSlugs.add(candidate);
  return candidate;
}

// ---------------------------------------------------------------------------
// Image grouping — fuzzy case-insensitive prefix match
// ---------------------------------------------------------------------------
function groupImages(allJpgs, docxBasename) {
  const docxKey = stripForMatch(docxBasename);
  const cover   = [];
  const numbered = [];

  for (const jpg of allJpgs) {
    const nameNoExt = jpg.replace(/\.[^.]+$/, "");
    const numMatch  = nameNoExt.match(/^(.+?)-(\d+)$/) || nameNoExt.match(/^(.+?)-(\d+)\s*$/);

    if (numMatch) {
      const imgKey = stripForMatch(numMatch[1]);
      if (fuzzyMatch(docxKey, imgKey)) {
        numbered.push({ file: jpg, n: parseInt(numMatch[2], 10) });
      }
    } else {
      const imgKey = stripForMatch(nameNoExt);
      if (fuzzyMatch(docxKey, imgKey)) {
        cover.push(jpg);
      }
    }
  }

  numbered.sort((a, b) => a.n - b.n);
  return { cover: cover[0] ?? null, extras: numbered.map((x) => x.file) };
}

function fuzzyMatch(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  const shorter = a.length < b.length ? a : b;
  const longer  = a.length < b.length ? b : a;
  if (longer.startsWith(shorter)) return true;
  let shared = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (shorter[i] === longer[i]) shared++;
    else break;
  }
  return shared / shorter.length >= 0.8;
}

// ---------------------------------------------------------------------------
// Content filtering
// ---------------------------------------------------------------------------
const FILTER_PATTERNS = [
  /https?:\/\/\S+/g,
  /www\.\S+/g,
  /@[\w.]+/g,
  /\b[\w.+-]+@[\w.-]+\.\w{2,}\b/g,
  /\b(rsvp|register here|sign up|join us|join the|click here|add to calendar|bit\.ly)\b/gi,
  /#\w+/g,
  /\+\d[\d\s()-]{7,}/g,
];

function filterText(text) {
  let out = normalizeMathUnicode(text);
  for (const p of FILTER_PATTERNS) out = out.replace(p, "");
  return out;
}

function cleanLine(line) {
  return filterText(line).replace(/\s+/g, " ").trim();
}

// ---------------------------------------------------------------------------
// Metadata inference
// ---------------------------------------------------------------------------
function inferYear(text, basename) {
  const currentYear = new Date().getFullYear();
  const combined = text + " " + basename;
  const matches = [...combined.matchAll(/\b(20\d{2})\b/g)]
    .map((m) => parseInt(m[1], 10))
    .filter((y) => y <= currentYear)
    .sort((a, b) => b - a);
  return matches[0] ?? currentYear;
}

const FORMAT_RULES = [
  [/\borganiz(ed|er|ing)\b/i, "Organizer"],
  [/\bmentor(ing|ed|s|ship)?\b/i, "Mentor"],
  [/\bpanel(ist)?\b/i, "Panelist"],
  [/\bworkshop\b/i, "Workshop"],
  [/\b(speaker|speaking|spoke|gave a talk|presented|presenting|delivered a session|delivered a talk)\b/i, "Speaker"],
  [/\battend(ed|ee|ing|ant)\b/i, "Attendee"],
];

function inferFormat(text) {
  for (const [regex, label] of FORMAT_RULES) {
    if (regex.test(text)) return label;
  }
  return "Speaker";
}

const TOPIC_RULES = [
  [/\b(generative ai|gen ai|genai|llm|gpt|openai|copilot|agentic)\b/i, "Generative AI"],
  [/\b(machine learning|ai[^r]|artificial intelligence|azure ai|azure ml|ai-102)\b/i, "AI & ML"],
  [/\b(devops|cicd|ci\/cd|github actions|azure devops|pipeline)\b/i, "DevOps"],
  [/\b(aws|amazon web services|s3|ec2)\b/i, "AWS"],
  [/\b(kubernetes|docker|container|cloud native)\b/i, "Cloud Native"],
  [/\b(personal brand|career|journey|community|cohort|includeher|mlsa|mentorship|hackathon)\b/i, "Community"],
  [/\b(azure|microsoft cloud|microsoft azure)\b/i, "Azure"],
];

function inferTopic(text, title) {
  const combined = text + " " + title;
  for (const [regex, label] of TOPIC_RULES) {
    if (regex.test(combined)) return label;
  }
  return "Cloud";
}

const KNOWN_TAGS = [
  "Azure", "AWS", "DevOps", "AI", "Generative AI", "OpenAI", "GitHub Copilot",
  "Cloud", "Kubernetes", "Docker", "Community", "Mentorship", "MLSA",
  "Microsoft", "Hackathon", "Workshop", "Bootcamp", "Career",
];

function inferTags(text, title) {
  const combined = (text + " " + title).toLowerCase();
  return KNOWN_TAGS.filter((tag) => combined.includes(tag.toLowerCase())).slice(0, 6);
}

// ---------------------------------------------------------------------------
// Content extraction
// ---------------------------------------------------------------------------
function extractSummary(paragraphs) {
  const good = paragraphs.filter(
    (p) => p.length > 40 && !/^[#*•\-–—!?]+$/.test(p)
  );
  return good.slice(0, 2).join(" ").slice(0, 600);
}

function extractHighlights(rawText) {
  const lines = rawText.split("\n");
  const bullets = lines
    .filter((l) => /^[\u2022\u2023\u25e6\u2043\-\*•]\s/.test(l.trim()))
    .map((l) => cleanLine(l.replace(/^[\u2022\u2023\u25e6\u2043\-\*•]\s+/, "")))
    .filter((l) => l.length > 20 && l.length < 300);
  return bullets.slice(0, 6);
}

function extractImpact(rawText) {
  const sentences = rawText.replace(/\n+/g, " ").split(/(?<=[.!])\s+/);
  return sentences
    .map(cleanLine)
    .filter(
      (s) =>
        /\d+/.test(s) &&
        s.length > 30 &&
        s.length < 200 &&
        !/https?:\/\//.test(s)
    )
    .slice(0, 3);
}

function extractTitleFromContent(rawText, fallback) {
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
  const first = lines[0];
  if (first && first.length > 5 && first.length < 150 && /[a-zA-Z]/.test(first)) {
    return cleanLine(first).replace(/[!?🎉]+$/, "").trim();
  }
  return fallback;
}

// ---------------------------------------------------------------------------
// Main processing
// ---------------------------------------------------------------------------
async function processEvent(docxFile, allJpgs) {
  const basename = docxFile.replace(/\.docx$/i, "");
  const slug     = deduplicateSlug(toSlug(basename));
  const fallbackTitle = titleFromBasename(basename);

  let rawText = "";
  try {
    const result = await mammoth.extractRawText({
      path: path.join(EVENTS_SOURCE, docxFile),
    });
    rawText = result.value || "";
  } catch (err) {
    console.warn(`[WARN] mammoth error on "${docxFile}": ${err.message}`);
  }

  const filteredText = filterText(rawText);
  const title = extractTitleFromContent(filteredText, fallbackTitle);

  const paragraphs = filteredText
    .split(/\n{2,}/)
    .map((p) => p.split("\n").map((l) => l.trim()).filter(Boolean).join(" "))
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 30);

  const year       = inferYear(rawText, basename);
  const format     = inferFormat(rawText);
  const topic      = inferTopic(rawText, title);
  const tags       = inferTags(rawText, title);
  const summary    = extractSummary(paragraphs);
  const highlights = extractHighlights(rawText);
  const impact     = extractImpact(rawText);

  const { cover, extras } = groupImages(allJpgs, basename);
  let coverImage = null;
  const images   = [];

  // If overrides already provide blob URLs for this event, skip copying images locally
  const override = overrides[slug] ?? {};
  const hasBlobImages = override.coverImage && override.coverImage.startsWith("https://");

  if (!hasBlobImages) {
    const destDir = path.join(OUTPUT_IMGS, slug);
    fs.mkdirSync(destDir, { recursive: true });

    if (cover) {
      try {
        fs.copyFileSync(path.join(EVENTS_SOURCE, cover), path.join(destDir, "cover.jpg"));
        coverImage = `/events/${slug}/cover.jpg`;
      } catch (e) {
        console.warn(`[WARN] Could not copy cover "${cover}": ${e.message}`);
      }
    }

    for (let i = 0; i < extras.length; i++) {
      try {
        fs.copyFileSync(path.join(EVENTS_SOURCE, extras[i]), path.join(destDir, `photo-${i + 1}.jpg`));
        images.push(`/events/${slug}/photo-${i + 1}.jpg`);
      } catch (e) {
        console.warn(`[WARN] Could not copy image "${extras[i]}": ${e.message}`);
      }
    }

    if (!cover && extras.length === 0) {
      console.warn(`[WARN] No images found for "${basename}"`);
    }
  }

  // Apply manual overrides — any field in events-overrides.json wins
  return { slug, title, year, format, topic, tags, summary, highlights, impact, coverImage, images, ...override };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
async function main() {
  console.log("Scanning:", EVENTS_SOURCE);

  if (!fs.existsSync(EVENTS_SOURCE)) {
    console.log("[INFO] My Events folder not found — skipping generation, using existing events.json.");
    process.exit(0);
  }

  // Clean public/events/ only if some events lack blob URL overrides
  const needsLocalImages = Object.keys(overrides).length === 0 ||
    Object.values(overrides).some((o) => !o.coverImage || !o.coverImage.startsWith("https://"));
  if (needsLocalImages) {
    if (fs.existsSync(OUTPUT_IMGS)) {
      fs.rmSync(OUTPUT_IMGS, { recursive: true, force: true });
    }
    fs.mkdirSync(OUTPUT_IMGS, { recursive: true });
  }

  const allFiles = fs.readdirSync(EVENTS_SOURCE);
  const docxFiles = allFiles.filter((f) => /\.docx$/i.test(f) && !f.startsWith("~$"));
  const jpgFiles  = allFiles.filter((f) => /\.jpe?g$/i.test(f));

  console.log(`Found ${docxFiles.length} DOCX files, ${jpgFiles.length} JPG files`);

  const events = [];
  for (const docx of docxFiles) {
    try {
      const event = await processEvent(docx, jpgFiles);
      if (event.slug) {
        events.push(event);
        console.log(`  ✓ ${event.title || event.slug} (${event.year}) [${event.format}] — ${event.coverImage ? "cover" : "no cover"}, ${event.images.length} photos`);
      }
    } catch (err) {
      console.error(`[ERROR] Skipping "${docx}": ${err.message}`);
    }
  }

  // Sort: non-AWS events first (year desc), then AWS events at the end
  events.sort((a, b) => {
    const aAws = a.topic === "AWS" ? 1 : 0;
    const bAws = b.topic === "AWS" ? 1 : 0;
    if (aAws !== bAws) return aAws - bAws;
    return b.year - a.year || a.title.localeCompare(b.title);
  });
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(events, null, 2), "utf-8");
  console.log(`\nGenerated ${events.length} events → ${OUTPUT_JSON}`);
  console.log("Done.");
}

main().catch((err) => {
  console.error("[FATAL]", err);
  process.exit(1);
});
