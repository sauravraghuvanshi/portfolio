import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getNewsletterDraft } from "@/lib/newsletter";
import { sendNewsletter } from "@/lib/newsletter-sender";

export const maxDuration = 300;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const draft = getNewsletterDraft(id);
  if (!draft) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (draft.status !== "approved") {
    return NextResponse.json(
      { error: "Newsletter must be approved before sending" },
      { status: 409 }
    );
  }

  try {
    const result = await sendNewsletter(draft);
    return NextResponse.json({
      message: `Sent to ${result.sent} subscriber(s)`,
      ...result,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
