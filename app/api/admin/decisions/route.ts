import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveADREntry } from "@/lib/admin";
import { getADRGallery } from "@/lib/content";
import { revalidatePath } from "next/cache";
import type { ADREntry } from "@/lib/content";
import { ADREntrySchema } from "@/lib/api-schemas";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = ADREntrySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const gallery = getADRGallery();
    const existing = gallery?.entries.find((e) => e.id === parsed.data.id);
    if (existing) {
      return NextResponse.json({ error: "An ADR with this ID already exists" }, { status: 409 });
    }

    const entry: ADREntry = {
      id: parsed.data.id,
      number: parsed.data.number,
      title: parsed.data.title,
      status: parsed.data.status,
      date: parsed.data.date,
      wafPillars: parsed.data.wafPillars,
      context: parsed.data.context,
      options: parsed.data.options ?? [],
      decision: parsed.data.decision,
      rationale: parsed.data.rationale,
      tradeoffs: parsed.data.tradeoffs,
      outcome: parsed.data.outcome,
      tags: parsed.data.tags ?? [],
    };

    saveADREntry(entry);
    revalidatePath("/decisions");
    revalidatePath("/");
    return NextResponse.json({ id: entry.id, message: "ADR created" }, { status: 201 });
  } catch (err) {
    console.error("ADR save error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
