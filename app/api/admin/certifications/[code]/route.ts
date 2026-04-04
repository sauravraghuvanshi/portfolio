import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveCertification, deleteCertification } from "@/lib/admin";
import { getCertifications } from "@/lib/content";
import { revalidatePath } from "next/cache";
import type { Certification } from "@/lib/content";
import { CertificationUpdateSchema } from "@/lib/api-schemas";

interface RouteParams {
  params: Promise<{ code: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { code } = await params;
    const existing = getCertifications().find((c) => c.code === code);
    if (!existing) {
      return NextResponse.json({ error: "Certification not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = CertificationUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const cert: Certification = {
      code,
      name: parsed.data.name ?? existing.name,
      issuer: parsed.data.issuer ?? existing.issuer,
      year: parsed.data.year ?? existing.year,
      verifyUrl: parsed.data.verifyUrl ?? existing.verifyUrl,
      badge: parsed.data.badge ?? existing.badge,
      color: parsed.data.color ?? existing.color,
    };

    saveCertification(cert);
    revalidatePath("/");
    return NextResponse.json({ code, message: "Certification updated" });
  } catch (err) {
    console.error("Certification update error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await params;
  const deleted = deleteCertification(code);
  if (!deleted) {
    return NextResponse.json({ error: "Certification not found" }, { status: 404 });
  }

  revalidatePath("/");
  return NextResponse.json({ message: "Certification deleted" });
}
