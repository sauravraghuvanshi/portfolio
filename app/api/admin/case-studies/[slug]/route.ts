import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveCaseStudy, deleteCaseStudy } from "@/lib/admin";
import { getCaseStudy, normalizeCategory } from "@/lib/content";
import { revalidatePath } from "next/cache";
import type { CaseStudyMeta } from "@/lib/content";

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
    const meta: CaseStudyMeta = {
      title: body.title ?? existing.title,
      subtitle: body.subtitle ?? existing.subtitle,
      slug,
      tags: body.tags ?? existing.tags,
      category: normalizeCategory(body.category ?? existing.category),
      timeline: body.timeline ?? existing.timeline,
      role: body.role ?? existing.role,
      client: body.client ?? existing.client,
      featured: body.featured ?? existing.featured,
      coverImage: body.coverImage ?? existing.coverImage,
      metrics: body.metrics ?? existing.metrics,
    };

    saveCaseStudy(meta, body.content ?? existing.content);
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
