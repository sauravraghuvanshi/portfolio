import { NextRequest, NextResponse } from "next/server";
import { generateWeeklyNewsletter } from "@/lib/newsletter-generator";

export const maxDuration = 120;

/**
 * Called by the GitHub Actions Saturday cron job.
 * Auth: Bearer token via NEWSLETTER_CRON_SECRET env var.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.NEWSLETTER_CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "NEWSLETTER_CRON_SECRET not configured" }, { status: 500 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const draft = await generateWeeklyNewsletter();
    return NextResponse.json({ message: "Draft created", draftId: draft.id, title: draft.title });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
