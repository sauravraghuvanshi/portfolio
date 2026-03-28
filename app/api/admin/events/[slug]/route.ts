import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveEvent, deleteEvent } from "@/lib/admin";
import { getEvent } from "@/lib/content";
import { revalidatePath } from "next/cache";
import type { EventMeta } from "@/lib/content";

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
    const event: EventMeta = {
      slug,
      title: body.title ?? existing.title,
      year: body.year ?? existing.year,
      format: body.format ?? existing.format,
      topic: body.topic ?? existing.topic,
      tags: body.tags ?? existing.tags,
      summary: body.summary ?? existing.summary,
      highlights: body.highlights ?? existing.highlights,
      impact: body.impact ?? existing.impact,
      coverImage: body.coverImage ?? existing.coverImage,
      coverImagePosition: body.coverImagePosition ?? existing.coverImagePosition,
      images: body.images ?? existing.images,
      featured: body.featured ?? existing.featured ?? false,
      location: body.location !== undefined ? body.location : existing.location,
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
