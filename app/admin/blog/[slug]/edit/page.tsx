import { notFound } from "next/navigation";
import { getBlogPost } from "@/lib/content";
import BlogEditor from "@/components/admin/BlogEditor";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Edit Post</h1>
      <BlogEditor mode="edit" initialData={post} />
    </div>
  );
}
