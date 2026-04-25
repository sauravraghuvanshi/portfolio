/**
 * image-generator.ts
 *
 * Generates images via Azure OpenAI (gpt-image-1 / dall-e-3) and uploads
 * them to Azure Blob Storage. Used by the AI Writer to auto-populate
 * [GENERATE_IMAGE: "..."] markers in generated content.
 */

import { uploadToBlob } from "@/lib/azure-storage";

const IMAGE_API_VERSION = "2025-04-01-preview";

export interface GeneratedImage {
  url: string;       // Azure Blob Storage public URL
  prompt: string;    // Original DALL-E prompt
  revisedPrompt?: string;
}

export interface ImageMarker {
  placeholder: string;  // The full [GENERATE_IMAGE: "..."] string
  prompt: string;       // The extracted prompt text
}

/**
 * Extract all [GENERATE_IMAGE: "prompt"] markers from markdown content.
 */
export function extractImageMarkers(markdown: string): ImageMarker[] {
  const markers: ImageMarker[] = [];
  const regex = /\[GENERATE_IMAGE:\s*"([^"]+)"\]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(markdown)) !== null) {
    markers.push({ placeholder: match[0], prompt: match[1] });
  }
  return markers;
}

/**
 * Generate a single image via Azure OpenAI and upload to Blob Storage.
 * Returns null on failure (caller decides how to handle gracefully).
 */
export async function generateAndUploadImage(
  prompt: string,
  blobPath: string
): Promise<GeneratedImage | null> {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT?.replace(/\/$/, "");
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_IMAGE_DEPLOYMENT || "gpt-image-1";

  if (!endpoint || !apiKey) {
    console.warn("[image-generator] Missing AZURE_OPENAI_ENDPOINT or AZURE_OPENAI_API_KEY");
    return null;
  }

  const url = `${endpoint}/openai/deployments/${deployment}/images/generations?api-version=${IMAGE_API_VERSION}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        prompt,
        n: 1,
        size: "1792x1024",
        quality: "high",
        output_format: "png",
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[image-generator] API error:", res.status, err);
      return null;
    }

    const data = await res.json();
    const imageData = data?.data?.[0];
    if (!imageData) return null;

    // gpt-image-1 returns base64 by default; DALL-E 3 returns a URL
    if (imageData.b64_json) {
      const buffer = Buffer.from(imageData.b64_json, "base64");
      const publicUrl = await uploadToBlob(blobPath, buffer, "image/png");
      return { url: publicUrl, prompt, revisedPrompt: imageData.revised_prompt };
    }

    if (imageData.url) {
      // Download the temp URL and re-upload to our blob storage
      const imgRes = await fetch(imageData.url, { signal: AbortSignal.timeout(30_000) });
      if (!imgRes.ok) return null;
      const arrayBuffer = await imgRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const publicUrl = await uploadToBlob(blobPath, buffer, "image/png");
      return { url: publicUrl, prompt, revisedPrompt: imageData.revised_prompt };
    }

    return null;
  } catch (err) {
    console.error("[image-generator] Failed:", err);
    return null;
  }
}

/**
 * Process all [GENERATE_IMAGE: "..."] markers in a markdown string.
 * Generates each image, uploads to Blob Storage, and replaces markers
 * with real ![alt](url) markdown. Returns the processed markdown.
 *
 * Failed image generations are replaced with an HTML comment so the
 * author can add images manually.
 */
export async function processImageMarkers(
  markdown: string,
  slug: string
): Promise<{ processed: string; coverImageUrl: string | null }> {
  const markers = extractImageMarkers(markdown);
  if (markers.length === 0) {
    return { processed: markdown, coverImageUrl: null };
  }

  let result = markdown;
  let coverImageUrl: string | null = null;
  let imageIndex = 0;

  for (const marker of markers) {
    const isCover = imageIndex === 0;
    const blobPath = isCover
      ? `blog/${slug}/cover-${Date.now()}.png`
      : `blog/${slug}/img-${imageIndex}-${Date.now()}.png`;

    const generated = await generateAndUploadImage(marker.prompt, blobPath);

    if (generated) {
      const altText = isCover ? "Cover image" : `Diagram ${imageIndex}`;
      const replacement = `![${altText}](${generated.url})`;
      result = result.replace(marker.placeholder, replacement);
      if (isCover) coverImageUrl = generated.url;
    } else {
      // Replace with a comment so it doesn't break rendering
      result = result.replace(
        marker.placeholder,
        `<!-- IMAGE: ${marker.prompt.slice(0, 80)} -->`
      );
    }

    imageIndex++;
  }

  return { processed: result, coverImageUrl };
}
