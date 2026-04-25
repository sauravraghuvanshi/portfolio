import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateAndUploadImage } from "@/lib/ai/image-generator";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { prompt, slug, index = 0 } = body as {
    prompt: string;
    slug: string;
    index?: number;
  };

  if (!prompt || !slug) {
    return NextResponse.json({ error: "prompt and slug are required" }, { status: 400 });
  }

  const isCover = index === 0;
  const blobPath = isCover
    ? `blog/${slug}/cover-${Date.now()}.png`
    : `blog/${slug}/img-${index}-${Date.now()}.png`;

  const result = await generateAndUploadImage(prompt, blobPath);

  if (!result) {
    return NextResponse.json({ error: "Image generation failed" }, { status: 502 });
  }

  return NextResponse.json({ url: result.url, revisedPrompt: result.revisedPrompt });
}
