import {
  Add01Icon,
  ArrowDown01Icon,
  Copy01Icon,
  Delete02Icon,
  File01Icon,
  Image01Icon,
  MusicNote01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeading } from "@/components/page-heading";
import { requireAnyAdminPermission } from "@/server/admin-access";
import {
  addMediaAsset,
  deleteMediaAsset,
  listMediaAssets,
} from "@/server/media";

const fieldClass =
  "h-10 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-xs outline-none transition focus:border-[var(--navy-bright)] focus:ring-1 focus:ring-[var(--navy-bright)]";

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await requireAnyAdminPermission(["CONTENT_DRAFT_VIEW"]);
  const rawParams = await searchParams;
  const categoryFilter = typeof rawParams.category === "string" ? rawParams.category as "IMAGE" | "AUDIO" | "DOCUMENT" : undefined;
  const searchQuery = typeof rawParams.q === "string" ? rawParams.q : undefined;
  const outcome = typeof rawParams.outcome === "string" ? rawParams.outcome : undefined;

  const assets = await listMediaAssets({
    category: categoryFilter,
    search: searchQuery,
  });

  async function addMediaAction(formData: FormData) {
    "use server";
    const context = await requireAnyAdminPermission(["CONTENT_DRAFT_CREATE"]);
    const title = String(formData.get("title") ?? "");
    const url = String(formData.get("url") ?? "");
    const category = (String(formData.get("category") ?? "IMAGE")) as "IMAGE" | "AUDIO" | "DOCUMENT";

    await addMediaAsset({
      actorUserId: context.user.id,
      title,
      url,
      category,
    });

    revalidatePath("/media");
    redirect("/media?outcome=added");
  }

  async function deleteMediaAction(formData: FormData) {
    "use server";
    const context = await requireAnyAdminPermission(["CONTENT_DRAFT_EDIT"]);
    const mediaId = String(formData.get("mediaId") ?? "");

    await deleteMediaAsset({
      actorUserId: context.user.id,
      mediaId,
    });

    revalidatePath("/media");
    redirect("/media?outcome=deleted");
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-[var(--line)] pb-6">
        <PageHeading
          eyebrow="Tài nguyên & Đa phương tiện"
          title="Thư viện Media"
          description="Quản lý hình ảnh biểu đồ, file âm thanh và tài liệu dùng trong các bài học và bài kiểm tra."
        />
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-slate-100 px-3 py-1 font-mono text-xs font-bold text-slate-800">
            {assets.length} tài nguyên
          </span>
        </div>
      </div>

      {outcome === "added" && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
          ✓ Đã thêm tài nguyên mới vào thư viện media thành công.
        </div>
      )}
      {outcome === "deleted" && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800">
          ✓ Đã xóa tài nguyên khỏi thư viện.
        </div>
      )}

      {/* Form Thêm Media Asset mới */}
      <section className="admin-panel mt-6 overflow-hidden bg-white shadow-2xs">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 text-sm font-extrabold text-[var(--ink)] bg-[#fff8df]">
            <span className="inline-flex items-center gap-2">
              <HugeiconsIcon icon={Add01Icon} size={18} />
              <span>Thêm tài nguyên mới (Hình ảnh / Audio)</span>
            </span>
            <HugeiconsIcon className="transition group-open:rotate-180" icon={ArrowDown01Icon} size={18} />
          </summary>

          <form action={addMediaAction} className="grid gap-4 border-t border-[#eadca9] p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block text-xs font-bold text-[var(--ink-soft)]">
                Tên tài nguyên
                <input className={fieldClass} name="title" placeholder="ví dụ: Biểu đồ Task 1 - Dân số đô thị" required />
              </label>
              <label className="block text-xs font-bold text-[var(--ink-soft)]">
                URL liên kết (CDN / S3 / Cloudinary)
                <input className={fieldClass} name="url" placeholder="https://..." required type="url" />
              </label>
              <label className="block text-xs font-bold text-[var(--ink-soft)]">
                Loại tài nguyên
                <select className={fieldClass} name="category" required>
                  <option value="IMAGE">Hình ảnh (IMAGE)</option>
                  <option value="AUDIO">Âm thanh (AUDIO)</option>
                  <option value="DOCUMENT">Tài liệu (DOCUMENT)</option>
                </select>
              </label>
            </div>

            <button
              className="h-10 justify-self-start rounded-xl bg-[var(--amber)] px-5 text-xs font-extrabold text-[#392800] hover:bg-[#e49400] transition"
              type="submit"
            >
              Thêm vào thư viện
            </button>
          </form>
        </details>
      </section>

      {/* Toolbar: Category filter & Search */}
      <div className="mt-6 flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-3 sm:p-4 shadow-2xs md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            href="/media"
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              !categoryFilter
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
            }`}
          >
            Tất cả
          </Link>
          <Link
            href="/media?category=IMAGE"
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              categoryFilter === "IMAGE"
                ? "bg-sky-600 text-white shadow-2xs"
                : "bg-sky-50 text-sky-800 hover:bg-sky-100"
            }`}
          >
            Hình ảnh
          </Link>
          <Link
            href="/media?category=AUDIO"
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              categoryFilter === "AUDIO"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            Âm thanh
          </Link>
        </div>

        <form className="relative flex-1 md:w-64" method="GET">
          <HugeiconsIcon
            icon={Search01Icon}
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            defaultValue={searchQuery}
            name="q"
            placeholder="Tìm theo tên file..."
            className="h-8 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-xs outline-none focus:border-[var(--navy-bright)]"
          />
        </form>
      </div>

      {/* Grid danh sách tài nguyên */}
      <section className="mt-6">
        {assets.length === 0 ? (
          <div className="admin-panel bg-white p-12 text-center">
            <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-sky-50 text-sky-700 mx-auto">
              <HugeiconsIcon icon={Image01Icon} size={24} />
            </div>
            <h3 className="font-heading text-base font-bold text-[var(--ink)]">Chưa có tài nguyên nào</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              Nhấn &ldquo;Thêm tài nguyên mới&rdquo; để lưu trữ URL hình ảnh hoặc âm thanh dùng cho bài học.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="admin-panel flex flex-col justify-between overflow-hidden bg-white shadow-2xs hover:border-[var(--navy-bright)] transition"
              >
                <div>
                  {/* Thumbnail / Preview Header */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100 flex items-center justify-center border-b border-[var(--line)]">
                    {asset.category === "IMAGE" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt={asset.title}
                        className="h-full w-full object-cover"
                        src={asset.url}
                      />
                    ) : asset.category === "AUDIO" ? (
                      <div className="grid size-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                        <HugeiconsIcon icon={MusicNote01Icon} size={24} />
                      </div>
                    ) : (
                      <div className="grid size-12 place-items-center rounded-2xl bg-slate-200 text-slate-700">
                        <HugeiconsIcon icon={File01Icon} size={24} />
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 uppercase">
                      {asset.category}
                    </span>
                    <h4 className="mt-1.5 font-heading text-xs sm:text-sm font-bold text-[var(--ink)] line-clamp-1" title={asset.title}>
                      {asset.title}
                    </h4>
                    <p className="mt-1 text-[11px] font-mono text-muted-foreground truncate" title={asset.url}>
                      {asset.url}
                    </p>
                    <p className="mt-1 text-[10px] text-[var(--ink-soft)]">
                      Đăng bởi {asset.uploadedByName}
                    </p>
                  </div>
                </div>

                <div className="border-t border-[var(--line)] p-3 flex items-center justify-between gap-2 bg-[#faf8f2]">
                  <a
                    href={asset.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-bold text-[var(--navy-bright)] hover:underline"
                  >
                    Mở liên kết ↗
                  </a>

                  <form action={deleteMediaAction}>
                    <input name="mediaId" type="hidden" value={asset.id} />
                    <button
                      type="submit"
                      className="text-muted-foreground hover:text-rose-600 transition p-1"
                      title="Xóa tài nguyên"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={15} />
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
