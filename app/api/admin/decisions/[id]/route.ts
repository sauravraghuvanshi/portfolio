import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveADREntry, deleteADREntry } from "@/lib/admin";
import { getADRGallery } from "@/lib/content";
import { revalidatePath } from "next/cache";
import type { ADREntry } from "@/lib/content";
import { ADREntryUpdateSchema } from "@/lib/api-schemas";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const gallery = getADRGallery();
    const existing = gallery?.entries.find((e) => e.id === id);
    if (!existing) {
      return NextResponse.json({ error: "ADR not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = ADREntryUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const entry: ADREntry = {
      id,
      number: parsed.data.number ?? existing.number,
      title: parsed.data.title ?? existing.title,
      status: parsed.data.status ?? existing.status,
      date: parsed.data.date ?? existing.date,
      wafPillars: parsed.data.wafPillars ?? existing.wafPillars,
      context: parsed.data.context ?? existing.context,
      options: parsed.data.options ?? existing.options,
      decision: parsed.data.decision ?? existing.decision,
      rationale: parsed.data.rationale ?? existing.rationale,
      tradeoffs: parsed.data.tradeoffs ?? existing.tradeoffs,
      outcome: parsed.data.outcome ?? existing.outcome,
      tags: parsed.data.tags ?? existing.tags ?? [],
    };

    saveADREntry(entry);
    revalidatePath("/decisions");
    revalidatePath("/");
    return NextResponse.json({ id, message: "ADR updated" });
  } catch (err) {
    console.error("ADR update error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const deleted = deleteADREntry(id);
  if (!deleted) {
    return NextResponse.json({ error: "ADR not found" }, { status: 404 });
  }

  revalidatePath("/decisions");
  revalidatePath("/");
  return NextResponse.json({ message: "ADR deleted" });
}
