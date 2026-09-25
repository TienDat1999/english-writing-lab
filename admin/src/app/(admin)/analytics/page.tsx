import { PageHeading } from "@/components/page-heading";
import { requireAdminContext } from "@/server/admin-access";
import { getAdminAnalyticsData } from "@/server/analytics";
import { AnalyticsClient } from "./analytics-client";

export default async function AnalyticsPage() {
  await requireAdminContext();
  const data = await getAdminAnalyticsData();

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-[var(--line)] pb-6 mb-6">
        <PageHeading
          eyebrow="Product Analytics & Insights"
          title="Thống kê & Phân tích Toàn hệ thống"
          description="Giám sát thời gian thực quy mô người học, lưu lượng nộp bài, phân bố dải điểm IELTS, các lỗi sai phổ biến và hiệu năng vận hành AI."
        />
      </div>

      <AnalyticsClient data={data} />
    </>
  );
}
