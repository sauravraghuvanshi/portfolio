import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getNewsletterDrafts } from "@/lib/newsletter";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const drafts = getNewsletterDrafts();
  return NextResponse.json({ drafts });
}
