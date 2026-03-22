import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveImage } from "@/lib/admin";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const slug = formData.get("slug") as string | null;
  const folder = formData.get("folder") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type. Allowed: JPEG, PNG, WebP, AVIF, GIF" }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await saveImage(file.name, buffer, folder || undefined, slug || undefined);
    return NextResponse.json({ url, message: "Image uploaded" });
  } catch (err) {
    console.error("Image upload error:", err);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
