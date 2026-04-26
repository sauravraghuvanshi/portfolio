/**
 * marker-processing.ts
 *
 * Pure functions for processing all AI Writer content markers.
 * Client-safe — no server-only imports (azure-storage, etc.).
 *
 * Marker types:
 *  - [MERMAID]...[/MERMAID]     → ```mermaid code fences
 *  - [YOUTUBE: "url" "title"]   → responsive iframe embed
 *  - [GENERATE_IMAGE: "prompt"] → extracted into ImageTask[] for async generation
 */

import type { ImageTask } from "@/types/ai-writer";

// ── Mermaid ─────────────────────────────────────────────────────────────────

/**
 * Convert [MERMAID]...[/MERMAID] markers to ```mermaid code fences.
 * Also sanitizes <br/> tags in node labels.
 */
export function convertMermaidMarkers(markdown: string): string {
  return markdown.replace(
    /\[MERMAID\]([\s\S]*?)\[\/MERMAID\]/g,
    (_match, content: string) => {
      const sanitized = content.trim().replace(/<br\s*\/?>/gi, " ");
      return "```mermaid\n" + sanitized + "\n```";
    }
  );
}

// ── YouTube ─────────────────────────────────────────────────────────────────

const YOUTUBE_MARKER_RE = /\[YOUTUBE:\s*"([^"]+)"\s+"([^"]+)"\]/g;

/**
 * Extract YouTube video ID from a YouTube URL.
 */
function extractVideoId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  return match?.[1] ?? null;
}

/**
 * Convert [YOUTUBE: "url" "title"] markers to responsive iframe embeds.
 */
export function convertYoutubeMarkers(markdown: string): string {
  return markdown.replace(YOUTUBE_MARKER_RE, (_match, url: string, title: string) => {
    const videoId = extractVideoId(url);
    if (!videoId) {
      // Fallback: render as a styled link
      return `[${title}](${url})`;
    }
    return [
      `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;margin:1rem 0">`,
      `<iframe src="https://www.youtube.com/embed/${videoId}" title="${title}" style="position:absolute;top:0;left:0;width:100%;height:100%" frameborder="0" allowfullscreen></iframe>`,
      `</div>`,
    ].join("");
  });
}

// ── Images ───────────────────────────────────────────────────────────────────

const IMAGE_MARKER_RE = /\[GENERATE_IMAGE:\s*"([^"]+)"\]/g;

/**
 * Extract [GENERATE_IMAGE: "prompt"] markers into ImageTask objects.
 * Does NOT modify the markdown — markers stay in place for later replacement.
 */
export function extractImageTasks(markdown: string): ImageTask[] {
  const tasks: ImageTask[] = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(IMAGE_MARKER_RE.source, "g");
  let index = 0;

  while ((match = re.exec(markdown)) !== null) {
    tasks.push({
      id: index === 0 ? "cover" : `img-${index}`,
      placeholder: match[0],
      prompt: match[1],
      status: "pending",
    });
    index++;
  }

  return tasks;
}

/**
 * Replace image markers in bodyMarkdown with results from completed ImageTasks.
 * - Done tasks: replaced with ![alt](url)
 * - Pending/error tasks: replaced with <!-- IMAGE PENDING: prompt -->
 */
export function applyImageResults(
  markdown: string,
  tasks: ImageTask[]
): { content: string; coverImageUrl: string | null } {
  let result = markdown;
  let coverImageUrl: string | null = null;

  for (const task of tasks) {
    if (task.status === "done" && task.url) {
      const alt = task.id === "cover" ? "Cover image" : `Diagram ${task.id}`;
      result = result.replace(task.placeholder, `![${alt}](${task.url})`);
      if (task.id === "cover") coverImageUrl = task.url;
    } else {
      result = result.replace(
        task.placeholder,
        `<!-- IMAGE PENDING: ${task.prompt.slice(0, 80)} -->`
      );
    }
  }

  return { content: result, coverImageUrl };
}

// ── Combined ─────────────────────────────────────────────────────────────────

/**
 * Process all markers in bodyMarkdown:
 * 1. Convert [MERMAID] markers to ```mermaid fences
 * 2. Convert [YOUTUBE] markers to iframe embeds
 * 3. Extract [GENERATE_IMAGE] markers into ImageTask[] (markers stay in place)
 */
export function processAllMarkers(bodyMarkdown: string): {
  processed: string;
  imageTasks: ImageTask[];
} {
  let processed = bodyMarkdown;
  processed = convertMermaidMarkers(processed);
  processed = convertYoutubeMarkers(processed);
  const imageTasks = extractImageTasks(processed);
  return { processed, imageTasks };
}
