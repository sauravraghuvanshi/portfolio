import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveProject } from "@/lib/admin";
import { getProjects } from "@/lib/content";
import { slugify } from "@/lib/utils";
import type { Project } from "@/lib/content";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, outcomes, tags, category, techStack, githubUrl, liveUrl, featured, year } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const id = slugify(title);

    const existing = getProjects().find((p) => p.id === id);
    if (existing) {
      return NextResponse.json({ error: "A project with this ID already exists" }, { status: 409 });
    }

    const project: Project = {
      id,
      title,
      description: description || "",
      outcomes: outcomes || [],
      tags: tags || [],
      category: category || "Azure",
      techStack: techStack || [],
      githubUrl: githubUrl || "#",
      liveUrl: liveUrl || "#",
      featured: featured || false,
      year: year || new Date().getFullYear(),
    };

    saveProject(project);
    return NextResponse.json({ id, message: "Project created" }, { status: 201 });
  } catch (err) {
    console.error("Project save error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
