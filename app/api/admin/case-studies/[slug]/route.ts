import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveCaseStudy, deleteCaseStudy } from "@/lib/admin";
import { getCaseStudy, normalizeCategory } from "@/lib/content";
import { revalidatePath } from "next/cache";
import type { CaseStudyMeta } from "@/lib/content";
import { CaseStudyUpdateSchema } from "@/lib/api-schemas";

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
    const existing = getCaseStudy(slug);
    if (!existing) {
      return NextResponse.json({ error: "Case study not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = CaseStudyUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const meta: CaseStudyMeta = {
      title: parsed.data.title ?? existing.title,
      subtitle: parsed.data.subtitle ?? existing.subtitle,
      slug,
      tags: parsed.data.tags ?? existing.tags,
      category: normalizeCategory(parsed.data.category ?? existing.category),
      timeline: parsed.data.timeline ?? existing.timeline,
      role: parsed.data.role ?? existing.role,
      client: parsed.data.client ?? existing.client,
      featured: parsed.data.featured ?? existing.featured,
      status: parsed.data.status ?? existing.status ?? "published",
      coverImage: parsed.data.coverImage ?? existing.coverImage,
      metrics: parsed.data.metrics ?? existing.metrics,
    };

    saveCaseStudy(meta, parsed.data.content ?? existing.content);
    revalidatePath("/case-studies");
    revalidatePath(`/case-studies/${slug}`);
    revalidatePath("/");
    return NextResponse.json({ slug, message: "Case study updated" });
  } catch (err) {
    console.error("Case study update error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const deleted = deleteCaseStudy(slug);
  if (!deleted) {
    return NextResponse.json({ error: "Case study not found" }, { status: 404 });
  }

  revalidatePath("/case-studies");
  revalidatePath(`/case-studies/${slug}`);
  revalidatePath("/");
  return NextResponse.json({ message: "Case study deleted" });
}
