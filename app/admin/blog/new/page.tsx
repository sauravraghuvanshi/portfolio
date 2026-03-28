import BlogEditor from "@/components/admin/BlogEditor";

export default function NewPostPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Create New Blog</h1>
      <BlogEditor mode="create" />
    </div>
  );
}
