import type { GroundingResult } from "@/types/ai-writer";

/**
 * Search Bing for Microsoft Learn docs.
 * Scoped to site:learn.microsoft.com for trusted results.
 * Returns [] gracefully if BING_SEARCH_API_KEY is not set.
 */
export async function groundWithBing(query: string): Promise<GroundingResult[]> {
  const apiKey = process.env.BING_SEARCH_API_KEY;
  if (!apiKey) return [];

  try {
    const params = new URLSearchParams({
      q: `site:learn.microsoft.com ${query}`,
      count: "5",
      responseFilter: "Webpages",
    });

    const res = await fetch(
      `https://api.bing.microsoft.com/v7.0/search?${params}`,
      {
        headers: { "Ocp-Apim-Subscription-Key": apiKey },
        next: { revalidate: 3600 }, // cache 1h
      }
    );

    if (!res.ok) return [];

    const data = await res.json();
    const pages = data.webPages?.value ?? [];

    return pages.map((p: { name: string; url: string; snippet: string }) => ({
      title: p.name,
      url: p.url,
      snippet: p.snippet,
    }));
  } catch {
    return [];
  }
}

/**
 * Search Azure AI Search index for Microsoft Learn content.
 * Returns [] gracefully if AZURE_SEARCH_* vars are not set.
 */
export async function groundWithAzureSearch(query: string): Promise<GroundingResult[]> {
  const endpoint = process.env.AZURE_SEARCH_ENDPOINT;
  const apiKey = process.env.AZURE_SEARCH_API_KEY;
  const indexName = process.env.AZURE_SEARCH_INDEX_NAME;

  if (!endpoint || !apiKey || !indexName) return [];

  try {
    const res = await fetch(
      `${endpoint}/indexes/${indexName}/docs/search?api-version=2024-07-01`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
        body: JSON.stringify({
          search: query,
          top: 5,
          queryType: "semantic",
          semanticConfiguration: "default",
        }),
      }
    );

    if (!res.ok) return [];

    const data = await res.json();
    const results = data.value ?? [];

    return results.map(
      (r: { title?: string; url?: string; content?: string }) => ({
        title: r.title ?? "Untitled",
        url: r.url ?? "",
        snippet: (r.content ?? "").slice(0, 300),
      })
    );
  } catch {
    return [];
  }
}

/**
 * Extract Azure/Microsoft topic keywords from conversation messages.
 */
export function extractAzureTopics(
  messages: { role: string; content: unknown }[]
): string[] {
  const azureKeywords = [
    "azure", "microsoft", "entra", "cosmos", "app service", "aks",
    "kubernetes", "functions", "logic apps", "devops", "bicep",
    "terraform", "openai", "cognitive", "monitor", "sentinel",
    "key vault", "storage", "sql", "redis", "service bus",
    "event grid", "event hub", "container", "api management",
    "front door", "cdn", "load balancer", "virtual network",
    "well-architected", "defender", "purview", "fabric",
    "copilot", "ai search", "bot service", "signalr",
    "application insights", "log analytics",
  ];

  const allText = messages
    .map((m) => (typeof m.content === "string" ? m.content : ""))
    .join(" ")
    .toLowerCase();

  const found = azureKeywords.filter((kw) => allText.includes(kw));
  return [...new Set(found)];
}

/**
 * Combined grounding: Bing + Azure AI Search, deduplicated.
 */
export async function groundMicrosoftTopics(
  topics: string[]
): Promise<GroundingResult[]> {
  if (topics.length === 0) return [];

  const query = topics.slice(0, 5).join(" ");

  const [bingResults, searchResults] = await Promise.all([
    groundWithBing(query),
    groundWithAzureSearch(query),
  ]);

  // Deduplicate by URL
  const seen = new Set<string>();
  const combined: GroundingResult[] = [];

  for (const r of [...bingResults, ...searchResults]) {
    if (r.url && !seen.has(r.url)) {
      seen.add(r.url);
      combined.push(r);
    }
  }

  return combined.slice(0, 8);
}
