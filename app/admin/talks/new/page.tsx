import TalkEditor from "@/components/admin/TalkEditor";

export default function NewTalkPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Create New Talk</h1>
      <TalkEditor mode="create" />
    </div>
  );
}
