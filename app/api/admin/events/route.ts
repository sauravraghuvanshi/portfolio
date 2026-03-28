import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveEvent } from "@/lib/admin";
import { getEvent } from "@/lib/content";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import type { EventMeta } from "@/lib/content";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, year, format, topic, tags, summary, highlights, impact, coverImage, coverImagePosition, images, featured, location } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const slug = slugify(title);

    const existing = getEvent(slug);
    if (existing) {
      return NextResponse.json({ error: "An event with this slug already exists" }, { status: 409 });
    }

    const event: EventMeta = {
      slug,
      title,
      year: year ?? new Date().getFullYear(),
      format: format ?? "Speaker",
      topic: topic ?? "",
      tags: tags ?? [],
      summary: summary ?? "",
      highlights: highlights ?? [],
      impact: impact ?? [],
      coverImage: coverImage ?? null,
      coverImagePosition: coverImagePosition ?? undefined,
      images: images ?? [],
      featured: featured ?? false,
      location: location ?? null,
    };

    saveEvent(event);
    revalidatePath("/events");
    revalidatePath(`/events/${slug}`);
    revalidatePath("/");
    return NextResponse.json({ slug, message: "Event created" }, { status: 201 });
  } catch (err) {
    console.error("Event save error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
