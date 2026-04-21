import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveCertification } from "@/lib/admin";
import { getCertifications } from "@/lib/content";
import { revalidatePath } from "next/cache";
import type { Certification } from "@/lib/content";
import { CertificationSchema } from "@/lib/api-schemas";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = CertificationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const { code, name, issuer, year, verifyUrl, badge, color, credentialId } = parsed.data;

    const existing = getCertifications().find((c) => c.code === code);
    if (existing) {
      return NextResponse.json({ error: "A certification with this code already exists" }, { status: 409 });
    }

    const cert: Certification = {
      code,
      name,
      issuer,
      year: year ?? new Date().getFullYear(),
      verifyUrl,
      badge,
      color,
      ...(credentialId ? { credentialId } : {}),
    };

    saveCertification(cert);
    revalidatePath("/");
    return NextResponse.json({ code, message: "Certification created" }, { status: 201 });
  } catch (err) {
    console.error("Certification save error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
