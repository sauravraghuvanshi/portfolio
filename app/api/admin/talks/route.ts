import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveTalk } from "@/lib/admin";
import { getTalks } from "@/lib/content";
import { revalidatePath } from "next/cache";
import type { Talk } from "@/lib/content";
import { TalkSchema } from "@/lib/api-schemas";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = TalkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const { id, title, topic, description, featured } = parsed.data;

    const existing = getTalks().find((t) => t.id === id);
    if (existing) {
      return NextResponse.json({ error: "A talk with this ID already exists" }, { status: 409 });
    }

    const talk: Talk = {
      id,
      title,
      topic: topic ?? "",
      description: description ?? undefined,
      featured: featured ?? false,
    };

    saveTalk(talk);
    revalidatePath("/talks");
    revalidatePath("/");
    return NextResponse.json({ id, message: "Talk created" }, { status: 201 });
  } catch (err) {
    console.error("Talk save error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
