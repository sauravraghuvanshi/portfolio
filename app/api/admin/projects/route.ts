import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveProject } from "@/lib/admin";
import { getProjects, normalizeCategory } from "@/lib/content";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import type { Project } from "@/lib/content";
import { ProjectSchema } from "@/lib/api-schemas";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = ProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const { title, description, outcomes, tags, category, techStack, githubUrl, liveUrl, featured, status, year } = parsed.data;

    const id = slugify(title);

    const existing = getProjects().find((p) => p.id === id);
    if (existing) {
      return NextResponse.json({ error: "A project with this ID already exists" }, { status: 409 });
    }

    const project: Project = {
      id,
      title,
      description: description ?? "",
      outcomes: outcomes ?? [],
      tags: tags ?? [],
      category: normalizeCategory(category).length > 0 ? normalizeCategory(category) : ["Azure"],
      techStack: techStack ?? [],
      githubUrl: githubUrl ?? "#",
      liveUrl: liveUrl ?? "#",
      featured: featured ?? false,
      status: status ?? "draft",
      year: year ?? new Date().getFullYear(),
    };

    saveProject(project);
    revalidatePath("/projects");
    revalidatePath("/");
    return NextResponse.json({ id, message: "Project created" }, { status: 201 });
  } catch (err) {
    console.error("Project save error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
