import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveCertification } from "@/lib/admin";
import { getCertifications } from "@/lib/content";
import { revalidatePath } from "next/cache";
import type { Certification } from "@/lib/content";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { code, name } = body;

    if (!code || !name) {
      return NextResponse.json({ error: "Code and name are required" }, { status: 400 });
    }

    const existing = getCertifications().find((c) => c.code === code);
    if (existing) {
      return NextResponse.json({ error: "A certification with this code already exists" }, { status: 409 });
    }

    const cert: Certification = {
      code,
      name,
      issuer: body.issuer ?? "",
      year: body.year ?? new Date().getFullYear(),
      verifyUrl: body.verifyUrl ?? "#",
      badge: body.badge ?? "",
      color: body.color ?? "blue",
    };

    saveCertification(cert);
    revalidatePath("/");
    return NextResponse.json({ code, message: "Certification created" }, { status: 201 });
  } catch (err) {
    console.error("Certification save error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
