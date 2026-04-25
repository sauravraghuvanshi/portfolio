import { NextRequest, NextResponse } from "next/server";
import { getSubscriberByEmail, addSubscriber } from "@/lib/newsletter";
import { sendWelcomeEmail } from "@/lib/newsletter-sender";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { z } from "zod";

const SubscribeSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().max(100).optional(),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = checkRateLimit(`newsletter-subscribe:${ip}`, { limit: 3, windowSeconds: 300 });
  if (!rl.allowed) return rateLimitResponse(rl.resetInSeconds);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = SubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { email, name } = parsed.data;

  const existing = getSubscriberByEmail(email);
  if (existing && existing.status === "active") {
    // Already subscribed — return success silently (don't reveal subscription status)
    return NextResponse.json({ message: "Subscribed!" }, { status: 200 });
  }

  const subscriber = addSubscriber(email, name);

  // Send welcome email (non-blocking, best-effort)
  sendWelcomeEmail(subscriber).catch(() => {});

  return NextResponse.json({ message: "Subscribed!" }, { status: 201 });
}
