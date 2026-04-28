import RadarEntryEditor from "@/components/admin/RadarEntryEditor";

export default function NewRadarEntryPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">New Radar Entry</h1>
      <RadarEntryEditor mode="create" />
    </div>
  );
}
