/**
 * First-party page-view beacon.
 *
 * `runtime = "nodejs"` is required: the store writes to the persistent volume
 * with `fs`, which the Edge runtime cannot do. No other route in this app
 * declares a runtime, so this is a deliberate first rather than an oversight.
 *
 * Responds 204 in every non-abusive case — the client is firing this via
 * `sendBeacon` and cannot act on an error, so surfacing one buys nothing and a
 * failed analytics write must never look like a broken page.
 */
import { PageViewSchema } from "@/lib/api-schemas";
import { recordPageView } from "@/lib/analytics-store";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** Crawlers announce themselves; honouring that keeps the numbers about humans. */
const BOT_UA =
  /bot|crawler|spider|crawling|slurp|bingpreview|headless|lighthouse|pingdom|uptime|curl|wget|python-requests|axios|monitor|preview|facebookexternalhit|embedly|scrapy/i;

const NO_CONTENT = new Response(null, { status: 204 });

export async function POST(req: Request) {
  const ip = getClientIp(req);

  // Generous ceiling: a real reader browsing hard stays far below it, while a
  // scripted loop trying to inflate the counter hits it quickly.
  const rl = checkRateLimit(`pageview:${ip}`, { limit: 120, windowSeconds: 3600 });
  if (!rl.allowed) return rateLimitResponse(rl.resetInSeconds);

  const userAgent = req.headers.get("user-agent") ?? "";
  if (!userAgent || BOT_UA.test(userAgent)) return NO_CONTENT;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NO_CONTENT;
  }

  const parsed = PageViewSchema.safeParse(body);
  if (!parsed.success) return NO_CONTENT;

  // The admin panel is the owner's own tooling — counting it would make the
  // traffic numbers mostly self-inflicted. API and asset paths likewise.
  const path = parsed.data.path;
  if (path.startsWith("/admin") || path.startsWith("/api") || path.startsWith("/_next")) {
    return NO_CONTENT;
  }

  try {
    recordPageView({
      path,
      referrer: parsed.data.referrer,
      host: req.headers.get("host"),
      ip,
      userAgent,
    });
  } catch {
    // Never let a counter failure reach the client.
  }

  return NO_CONTENT;
}
