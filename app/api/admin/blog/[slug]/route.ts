import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveBlogPost, deleteBlogPost } from "@/lib/admin";
import { getBlogPost, normalizeCategory } from "@/lib/content";
import { revalidatePath } from "next/cache";
import type { BlogPostMeta } from "@/lib/content";
import { BlogPostUpdateSchema } from "@/lib/api-schemas";

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
    const existing = getBlogPost(slug);
    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = BlogPostUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const meta: BlogPostMeta = {
      title: parsed.data.title ?? existing.title,
      slug,
      description: parsed.data.description ?? existing.description,
      date: existing.date,
      updated: new Date().toISOString().split("T")[0],
      category: normalizeCategory(parsed.data.category ?? existing.category),
      tags: parsed.data.tags ?? existing.tags,
      coverImage: parsed.data.coverImage ?? existing.coverImage,
      featured: parsed.data.featured ?? existing.featured,
      status: parsed.data.status ?? existing.status,
      externalUrl: parsed.data.externalUrl ?? existing.externalUrl,
      externalSource: parsed.data.externalSource ?? existing.externalSource,
    };

    saveBlogPost(meta, parsed.data.content ?? existing.content);
    revalidatePath("/blog");
    revalidatePath(`/blog/${slug}`);
    revalidatePath("/");
    return NextResponse.json({ slug, message: "Post updated" });
  } catch (err) {
    console.error("Blog update error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const deleted = deleteBlogPost(slug);
  if (!deleted) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/");
  return NextResponse.json({ message: "Post deleted" });
}
