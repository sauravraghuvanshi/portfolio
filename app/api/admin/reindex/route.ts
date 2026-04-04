import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { runRagPipeline } from "@/lib/ai/rag-pipeline";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const maxDuration = 300;

const isDev = process.env.NODE_ENV === "development";
const log = isDev ? console.log : () => {};

let reindexInProgress = false;

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 5 requests per minute
  const rl = checkRateLimit("reindex", { limit: 5, windowSeconds: 60 });
  if (!rl.allowed) return rateLimitResponse(rl.resetInSeconds);

  if (reindexInProgress) {
    return NextResponse.json({ status: "already_running" }, { status: 409 });
  }

  reindexInProgress = true;
  try {
    log("[reindex] Pipeline started");
    const result = await runRagPipeline();
    log("[reindex] Pipeline completed:", result.status);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[reindex] Pipeline error:", err);
    return NextResponse.json(
      { status: "error", error: String(err) },
      { status: 500 }
    );
  } finally {
    reindexInProgress = false;
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ inProgress: reindexInProgress });
}
