import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveCaseStudy } from "@/lib/admin";
import { getCaseStudy } from "@/lib/content";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import type { CaseStudyMeta } from "@/lib/content";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, subtitle, category, tags, timeline, role, client, featured, coverImage, metrics, content } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const slug = slugify(title);

    if (getCaseStudy(slug)) {
      return NextResponse.json({ error: "A case study with this slug already exists" }, { status: 409 });
    }

    const meta: CaseStudyMeta = {
      title,
      subtitle: subtitle || "",
      slug,
      tags: tags || [],
      category: category || "Cloud Architecture",
      timeline: timeline || "",
      role: role || "",
      client: client || "",
      featured: featured || false,
      coverImage: coverImage || "",
      metrics: metrics || [],
    };

    saveCaseStudy(meta, content || "");
    revalidatePath("/case-studies");
    revalidatePath(`/case-studies/${slug}`);
    revalidatePath("/");
    return NextResponse.json({ slug, message: "Case study created" }, { status: 201 });
  } catch (err) {
    console.error("Case study save error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
