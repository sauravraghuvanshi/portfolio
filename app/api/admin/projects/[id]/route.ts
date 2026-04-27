import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveProject, deleteProject } from "@/lib/admin";
import { getProjects, normalizeCategory } from "@/lib/content";
import { revalidatePath } from "next/cache";
import type { Project } from "@/lib/content";
import { ProjectUpdateSchema } from "@/lib/api-schemas";

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
    const existing = getProjects().find((p) => p.id === id);
    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = ProjectUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const project: Project = {
      id,
      title: parsed.data.title ?? existing.title,
      description: parsed.data.description ?? existing.description,
      outcomes: parsed.data.outcomes ?? existing.outcomes,
      tags: parsed.data.tags ?? existing.tags,
      category: normalizeCategory(parsed.data.category ?? existing.category),
      techStack: parsed.data.techStack ?? existing.techStack,
      githubUrl: parsed.data.githubUrl ?? existing.githubUrl,
      liveUrl: parsed.data.liveUrl ?? existing.liveUrl,
      featured: parsed.data.featured ?? existing.featured,
      status: parsed.data.status ?? existing.status ?? "published",
      year: parsed.data.year ?? existing.year,
    };

    saveProject(project);
    revalidatePath("/projects");
    revalidatePath("/");
    return NextResponse.json({ id, message: "Project updated" });
  } catch (err) {
    console.error("Project update error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const deleted = deleteProject(id);
  if (!deleted) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  revalidatePath("/projects");
  revalidatePath("/");
  return NextResponse.json({ message: "Project deleted" });
}
