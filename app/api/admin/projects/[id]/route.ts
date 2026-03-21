import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveProject, deleteProject } from "@/lib/admin";
import { getProjects } from "@/lib/content";
import type { Project } from "@/lib/content";

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
    const project: Project = {
      id,
      title: body.title ?? existing.title,
      description: body.description ?? existing.description,
      outcomes: body.outcomes ?? existing.outcomes,
      tags: body.tags ?? existing.tags,
      category: body.category ?? existing.category,
      techStack: body.techStack ?? existing.techStack,
      githubUrl: body.githubUrl ?? existing.githubUrl,
      liveUrl: body.liveUrl ?? existing.liveUrl,
      featured: body.featured ?? existing.featured,
      year: body.year ?? existing.year,
    };

    saveProject(project);
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

  return NextResponse.json({ message: "Project deleted" });
}
