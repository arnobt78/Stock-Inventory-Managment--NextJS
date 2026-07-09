import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getHistoryDetailForPage } from "@/lib/server/history-detail-data";
import AdminHistoryDetailContent from "@/components/admin/AdminHistoryDetailContent";

type Props = { params: Promise<{ id: string }> };

/** REQ-0025 — blocking SSR detail prefetch (no Suspense shell flash). */
export const dynamic = "force-dynamic";

export default async function AdminActivityHistoryDetailPage({ params }: Props) {
  const user = await getSession();
  if (!user) redirect("/login");
  const { id } = await params;

  const initialRecord = await getHistoryDetailForPage(
    { id: user.id, role: user.role },
    id,
  );
  if (!initialRecord) notFound();

  return (
    <AdminHistoryDetailContent
      backHref="/admin/activity-history"
      initialRecord={initialRecord}
    />
  );
}
