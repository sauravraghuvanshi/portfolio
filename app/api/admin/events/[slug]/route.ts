import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveEvent, deleteEvent } from "@/lib/admin";
import { getEvent } from "@/lib/content";
import { revalidatePath } from "next/cache";
import type { EventMeta } from "@/lib/content";
import { EventUpdateSchema } from "@/lib/api-schemas";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { slug } = await params;
    const existing = getEvent(slug);
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = EventUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const event: EventMeta = {
      slug,
      title: parsed.data.title ?? existing.title,
      year: parsed.data.year ?? existing.year,
      format: parsed.data.format ?? existing.format,
      topic: parsed.data.topic ?? existing.topic,
      tags: parsed.data.tags ?? existing.tags,
      summary: parsed.data.summary ?? existing.summary,
      highlights: parsed.data.highlights ?? existing.highlights,
      impact: parsed.data.impact ?? existing.impact,
      coverImage: parsed.data.coverImage ?? existing.coverImage,
      coverImagePosition: parsed.data.coverImagePosition ?? existing.coverImagePosition,
      images: parsed.data.images ?? existing.images,
      featured: parsed.data.featured ?? existing.featured ?? false,
      location: parsed.data.location !== undefined ? parsed.data.location : existing.location,
    };

    saveEvent(event);
    revalidatePath("/events");
    revalidatePath(`/events/${slug}`);
    revalidatePath("/");
    return NextResponse.json({ slug, message: "Event updated" });
  } catch (err) {
    console.error("Event update error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const deleted = deleteEvent(slug);
  if (!deleted) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  revalidatePath("/events");
  revalidatePath(`/events/${slug}`);
  revalidatePath("/");
  return NextResponse.json({ message: "Event deleted" });
}
