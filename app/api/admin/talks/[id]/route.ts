import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveTalk, deleteTalk } from "@/lib/admin";
import { getTalks } from "@/lib/content";
import { revalidatePath } from "next/cache";
import type { Talk } from "@/lib/content";
import { TalkUpdateSchema } from "@/lib/api-schemas";

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
    const existing = getTalks().find((t) => t.id === id);
    if (!existing) {
      return NextResponse.json({ error: "Talk not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = TalkUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const talk: Talk = {
      id,
      title: parsed.data.title ?? existing.title,
      topic: parsed.data.topic ?? existing.topic,
      description: parsed.data.description ?? existing.description,
      featured: parsed.data.featured ?? existing.featured,
      status: parsed.data.status ?? existing.status ?? "published",
    };

    saveTalk(talk);
    revalidatePath("/talks");
    revalidatePath("/");
    return NextResponse.json({ id, message: "Talk updated" });
  } catch (err) {
    console.error("Talk update error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const deleted = deleteTalk(id);
  if (!deleted) {
    return NextResponse.json({ error: "Talk not found" }, { status: 404 });
  }

  revalidatePath("/talks");
  revalidatePath("/");
  return NextResponse.json({ message: "Talk deleted" });
}
