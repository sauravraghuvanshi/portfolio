import { NextRequest, NextResponse } from "next/server";
import { downloadBlob } from "@/lib/azure-storage";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const segments = (await params).path;

  // Validate: no empty segments or directory traversal
  if (segments.some((s) => !s || s === ".." || /[\\]/.test(s))) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const blobPath = segments.join("/");
  const result = await downloadBlob(blobPath);

  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(result.buffer), {
    headers: {
      "Content-Type": result.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
