import { saveNewsletterDraft, type NewsletterDraft } from "./newsletter";
import { buildSectionsHtml, type NewsletterSection } from "./newsletter-template";

interface BingResult {
  title: string;
  url: string;
  snippet: string;
}

interface GeneratedNewsletter {
  subject: string;
  previewText: string;
  title: string;
  sections: NewsletterSection[];
}

const NEWS_QUERIES = [
  "artificial intelligence news this week 2026",
  "Azure cloud announcements this week",
  "Microsoft AI Foundry updates 2026",
  "generative AI enterprise news this week",
  "OpenAI GPT news this week",
  "cloud architecture best practices 2026",
];

// ---------------------------------------------------------------------------
// Bing News Search
// ---------------------------------------------------------------------------

async function searchBing(query: string): Promise<BingResult[]> {
  const apiKey = process.env.BING_SEARCH_API_KEY;
  if (!apiKey) return [];

  try {
    const params = new URLSearchParams({
      q: query,
      count: "4",
      responseFilter: "Webpages",
      freshness: "Week",
    });

    const res = await fetch(
      `https://api.bing.microsoft.com/v7.0/search?${params}`,
      { headers: { "Ocp-Apim-Subscription-Key": apiKey } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.webPages?.value ?? []).map(
      (p: { name: string; url: string; snippet: string }) => ({
        title: p.name,
        url: p.url,
        snippet: p.snippet,
      })
    );
  } catch {
    return [];
  }
}

async function fetchNewsContext(): Promise<{ results: BingResult[]; sources: string[] }> {
  const allResults = (
    await Promise.all(NEWS_QUERIES.map((q) => searchBing(q)))
  ).flat();

  // Deduplicate by URL
  const seen = new Set<string>();
  const results: BingResult[] = [];
  for (const r of allResults) {
    if (r.url && !seen.has(r.url)) {
      seen.add(r.url);
      results.push(r);
    }
  }

  const sources = results.slice(0, 20).map((r) => r.url);
  return { results: results.slice(0, 20), sources };
}

// ---------------------------------------------------------------------------
// Azure OpenAI call
// ---------------------------------------------------------------------------

async function callAzureOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4o";

  if (!endpoint || !apiKey) throw new Error("Azure OpenAI not configured");

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-08-01-preview`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Azure OpenAI error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ---------------------------------------------------------------------------
// DALL-E 3 Cover Image (optional)
// ---------------------------------------------------------------------------

async function generateCoverImage(title: string): Promise<string | undefined> {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_IMAGE_DEPLOYMENT ?? "dall-e-3";

  if (!endpoint || !apiKey) return undefined;

  try {
    const url = `${endpoint}/openai/deployments/${deployment}/images/generations?api-version=2024-02-01`;
    const prompt = `A modern, professional newsletter cover image for a cloud architecture and AI technology digest. Title: "${title}". Style: clean, minimalist, dark blue gradient background with abstract tech patterns, Azure cloud icons, neural network nodes. Professional, high-quality, suitable for email newsletter header. No text in the image.`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": apiKey },
      body: JSON.stringify({ prompt, n: 1, size: "1792x1024", quality: "standard" }),
    });

    if (!res.ok) return undefined;
    const data = await res.json();
    return data.data?.[0]?.url as string | undefined;
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export interface GenerateNewsletterOptions {
  weekOf?: string; // "YYYY-MM-DD", defaults to this Monday
}

export async function generateWeeklyNewsletter(
  options: GenerateNewsletterOptions = {}
): Promise<NewsletterDraft> {
  const weekOf =
    options.weekOf ??
    (() => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); // this Monday
      return d.toISOString().slice(0, 10);
    })();

  // 1. Fetch news context
  const { results: newsResults, sources } = await fetchNewsContext();

  const newsContext =
    newsResults.length > 0
      ? newsResults
          .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nURL: ${r.url}`)
          .join("\n\n")
      : "No recent news fetched — generate a newsletter based on general AI and Azure Cloud trends as of 2026.";

  // 2. Generate newsletter content via gpt-4o
  const systemPrompt = `You are a senior newsletter writer for cloud architects and AI engineering leaders.
Your audience: senior software architects, CTOs, engineering managers working with Azure and AI.
Style: concise, insightful, authoritative — no hype, no filler.
You MUST respond with valid JSON only.`;

  const userPrompt = `Here are this week's top news articles about AI and Cloud:

${newsContext}

Write a weekly newsletter with this exact JSON structure:
{
  "subject": "string (email subject line, max 60 chars, engaging)",
  "previewText": "string (email preview text, max 90 chars)",
  "title": "string (newsletter main title, e.g. 'Cloud & AI Weekly — Apr 21, 2026')",
  "sections": [
    {
      "type": "stories",
      "heading": "Top Stories This Week",
      "items": [
        { "title": "...", "content": "2-3 sentence analysis for architects", "url": "..." },
        ... (5 stories total)
      ]
    },
    {
      "type": "spotlight",
      "heading": "Short title of the Azure announcement",
      "content": "3-4 sentence deep-dive on the most important Azure announcement this week and why it matters for cloud architects",
      "url": "optional URL"
    },
    {
      "type": "tip",
      "heading": "Short title of the tip",
      "content": "2-3 sentences: actionable architecture or AI engineering tip relevant to this week's news"
    }
  ]
}

Respond with ONLY the JSON object, no markdown, no additional text.`;

  const raw = await callAzureOpenAI(systemPrompt, userPrompt);

  let generated: GeneratedNewsletter;
  try {
    generated = JSON.parse(raw) as GeneratedNewsletter;
  } catch {
    throw new Error(`Failed to parse AI response as JSON: ${raw.slice(0, 200)}`);
  }

  // 3. Build HTML content from sections
  const htmlContent = buildSectionsHtml(generated.sections ?? []);

  // 4. Optionally generate cover image
  const coverImageUrl = await generateCoverImage(generated.title);

  // 5. Save draft
  const draft: NewsletterDraft = {
    id: crypto.randomUUID(),
    title: generated.title,
    subject: generated.subject,
    previewText: generated.previewText,
    htmlContent,
    coverImageUrl,
    status: "draft",
    generatedAt: new Date().toISOString(),
    weekOf,
    sources,
  };

  saveNewsletterDraft(draft);
  return draft;
}
