import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveCertification, deleteCertification } from "@/lib/admin";
import { getCertifications } from "@/lib/content";
import { revalidatePath } from "next/cache";
import type { Certification } from "@/lib/content";

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
    const cert: Certification = {
      code,
      name: body.name ?? existing.name,
      issuer: body.issuer ?? existing.issuer,
      year: body.year ?? existing.year,
      verifyUrl: body.verifyUrl ?? existing.verifyUrl,
      badge: body.badge ?? existing.badge,
      color: body.color ?? existing.color,
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
