import { notFound } from "next/navigation";
import { getCertifications } from "@/lib/content";
import CertificationEditor from "@/components/admin/CertificationEditor";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function EditCertificationPage({ params }: PageProps) {
  const { code } = await params;
  const decoded = decodeURIComponent(code);
  const cert = getCertifications(true).find((c) => c.code === decoded);

  if (!cert) return notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Edit Certification — {cert.code}</h1>
      <CertificationEditor mode="edit" initialData={cert} />
    </div>
  );
}
