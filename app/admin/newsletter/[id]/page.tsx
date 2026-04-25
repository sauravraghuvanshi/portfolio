import NewsletterDraftView from "@/components/admin/NewsletterDraftView";

export const metadata = { title: "Newsletter Draft — Admin" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NewsletterDraftPage({ params }: PageProps) {
  const { id } = await params;
  return <NewsletterDraftView id={id} />;
}
