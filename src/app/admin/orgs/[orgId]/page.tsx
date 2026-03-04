import AdminOrgDetail from "@/components/admin/admin-org-detail";

export default async function AdminOrgPage({
  params
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <AdminOrgDetail orgId={orgId} />;
}