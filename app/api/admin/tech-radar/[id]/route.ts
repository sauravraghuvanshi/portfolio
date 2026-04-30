import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveRadarEntry, deleteRadarEntry } from "@/lib/admin";
import { getTechRadar } from "@/lib/content";
import { revalidatePath } from "next/cache";
import { RadarEntryUpdateSchema } from "@/lib/api-schemas";
import type { RadarEntry } from "@/lib/content";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const entry = getTechRadar()?.entries.find((e) => e.id === id);
  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }
  return NextResponse.json(entry);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const existing = getTechRadar()?.entries.find((e) => e.id === id);
    if (!existing) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = RadarEntryUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const entry: RadarEntry = {
      id,
      name: parsed.data.name ?? existing.name,
      quadrant: parsed.data.quadrant ?? existing.quadrant,
      ring: parsed.data.ring ?? existing.ring,
      summary: parsed.data.summary ?? existing.summary,
      ...(( parsed.data.useWhen ?? existing.useWhen) && { useWhen: parsed.data.useWhen ?? existing.useWhen }),
      ...((parsed.data.avoidWhen ?? existing.avoidWhen) && { avoidWhen: parsed.data.avoidWhen ?? existing.avoidWhen }),
      ...((parsed.data.movedFrom ?? existing.movedFrom) && { movedFrom: parsed.data.movedFrom ?? existing.movedFrom }),
      ...((parsed.data.tags ?? existing.tags)?.length && { tags: parsed.data.tags ?? existing.tags }),
      status: parsed.data.status ?? existing.status ?? "draft",
    };

    saveRadarEntry(entry);
    revalidatePath("/tech-radar");
    return NextResponse.json({ id, message: "Entry updated" });
  } catch (err) {
    console.error("Radar entry update error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const deleted = deleteRadarEntry(id);
  if (!deleted) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  revalidatePath("/tech-radar");
  return NextResponse.json({ message: "Entry deleted" });
}
