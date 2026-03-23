import CertificationEditor from "@/components/admin/CertificationEditor";

export default function NewCertificationPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Add New Certification</h1>
      <CertificationEditor mode="create" />
    </div>
  );
}
