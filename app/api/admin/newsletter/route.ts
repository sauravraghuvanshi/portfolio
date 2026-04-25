import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSubscribers, getSubscriberStats, getLastSentNewsletter } from "@/lib/newsletter";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subscribers = getSubscribers();
  const stats = getSubscriberStats();
  const lastSent = getLastSentNewsletter();

  return NextResponse.json({
    subscribers,
    stats,
    lastSentAt: lastSent?.sentAt ?? null,
    lastSentTitle: lastSent?.title ?? null,
  });
}
