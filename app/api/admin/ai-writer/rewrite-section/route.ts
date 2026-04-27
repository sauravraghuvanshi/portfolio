import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { callFoundryAgent } from "@/lib/ai/foundry-agent";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { selectedText, feedback, title } = (await req.json()) as {
    selectedText: string;
    feedback: string;
    title?: string;
  };

  if (!selectedText?.trim() || !feedback?.trim()) {
    return NextResponse.json(
      { error: "selectedText and feedback are required" },
      { status: 400 }
    );
  }

  const systemPrompt = `You are a technical content editor. Your only task is to rewrite the provided markdown section according to the given revision instructions. Do NOT use any external tools or search. Return ONLY the rewritten markdown content — no explanations, no preamble, no surrounding code fences.`;

  const userMessage = `Post title: "${title ?? ""}"\n\nOriginal section to rewrite:\n${selectedText}\n\nRevision instructions:\n${feedback}`;

  try {
    const rewritten = await callFoundryAgent(
      systemPrompt,
      [{ role: "user", content: userMessage }],
      "rewrite-section"
    );
    return NextResponse.json({ rewritten: rewritten.trim() });
  } catch (err) {
    console.error("[rewrite-section] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
