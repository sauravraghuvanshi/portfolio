import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getNewsletterDraft, updateNewsletterDraft } from "@/lib/newsletter";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const draft = getNewsletterDraft(id);
  if (!draft) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (draft.status === "sent") {
    return NextResponse.json({ error: "Newsletter already sent" }, { status: 409 });
  }

  const updated = updateNewsletterDraft(id, {
    status: "approved",
    approvedAt: new Date().toISOString(),
  });

  return NextResponse.json({ draft: updated });
}
