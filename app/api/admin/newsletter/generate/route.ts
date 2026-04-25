import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateWeeklyNewsletter } from "@/lib/newsletter-generator";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = checkRateLimit("newsletter-generate", { limit: 3, windowSeconds: 3600 });
  if (!rl.allowed) return rateLimitResponse(rl.resetInSeconds);

  let weekOf: string | undefined;
  try {
    const body = await request.json().catch(() => ({}));
    if (typeof body.weekOf === "string") weekOf = body.weekOf;
  } catch {
    // ignore
  }

  try {
    const draft = await generateWeeklyNewsletter({ weekOf });
    return NextResponse.json({ draft }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
