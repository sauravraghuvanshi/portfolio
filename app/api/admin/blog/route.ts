import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveBlogPost } from "@/lib/admin";
import { getBlogPost, normalizeCategory } from "@/lib/content";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import type { BlogPostMeta } from "@/lib/content";
import { BlogPostSchema } from "@/lib/api-schemas";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = BlogPostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const { title, description, category, tags, coverImage, featured, status, content, externalUrl, externalSource } = parsed.data;

    const slug = slugify(title);

    if (getBlogPost(slug)) {
      return NextResponse.json({ error: "A post with this slug already exists" }, { status: 409 });
    }

    const meta: BlogPostMeta = {
      title,
      slug,
      description: description || "",
      date: new Date().toISOString().split("T")[0],
      category: normalizeCategory(category).length > 0 ? normalizeCategory(category) : ["General"],
      tags: tags || [],
      coverImage: coverImage || undefined,
      featured: featured || false,
      status: status || "draft",
      externalUrl: externalUrl || undefined,
      externalSource: externalSource || undefined,
    };

    saveBlogPost(meta, content || "");
    revalidatePath("/blog");
    revalidatePath(`/blog/${slug}`);
    revalidatePath("/");
    return NextResponse.json({ slug, message: "Post created" }, { status: 201 });
  } catch (err) {
    console.error("Blog save error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
