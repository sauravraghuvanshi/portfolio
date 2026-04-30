import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveRadarEntry } from "@/lib/admin";
import { getTechRadar } from "@/lib/content";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { RadarEntrySchema } from "@/lib/api-schemas";
import type { RadarEntry } from "@/lib/content";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const radar = getTechRadar();
  return NextResponse.json(radar?.entries ?? []);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Auto-generate id from name if not provided
    if (!body.id && body.name) {
      body.id = slugify(body.name);
    }

    const parsed = RadarEntrySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const existing = getTechRadar()?.entries.find((e) => e.id === parsed.data.id);
    if (existing) {
      return NextResponse.json({ error: "An entry with this ID already exists" }, { status: 409 });
    }

    const entry: RadarEntry = {
      id: parsed.data.id,
      name: parsed.data.name,
      quadrant: parsed.data.quadrant,
      ring: parsed.data.ring,
      summary: parsed.data.summary,
      ...(parsed.data.useWhen && { useWhen: parsed.data.useWhen }),
      ...(parsed.data.avoidWhen && { avoidWhen: parsed.data.avoidWhen }),
      ...(parsed.data.movedFrom && { movedFrom: parsed.data.movedFrom }),
      ...(parsed.data.tags?.length && { tags: parsed.data.tags }),
      status: parsed.data.status ?? "draft",
    };

    saveRadarEntry(entry);
    revalidatePath("/tech-radar");
    return NextResponse.json({ id: entry.id, message: "Entry created" }, { status: 201 });
  } catch (err) {
    console.error("Radar entry create error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
