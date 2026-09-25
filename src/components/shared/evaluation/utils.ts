import type { ScoreTier } from "./types";

export function parsePatternTip(raw: string) {
  if (!raw) return { pattern: "", explanation: "", tokens: [] as string[] };
  const match = raw.match(/^(.*?)(?:\s*\(([^()]+)\))\s*$/);
  const pattern = match ? match[1].trim() : raw.trim();
  const explanation = match ? match[2].trim() : "";
  const tokens = pattern.split(/(\[[^\]]+\])/g).filter(Boolean);
  return { pattern, explanation, tokens };
}

export function getScoreTier(score: number): ScoreTier {
  if (score >= 90) {
    return {
      tier: "Xuất sắc",
      badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
      containerClass: "border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 text-emerald-950",
      scoreClass: "text-emerald-600",
      title: "Xuất sắc · Đạt chuẩn B2+",
    };
  }
  if (score >= 75) {
    return {
      tier: "Đạt chuẩn",
      badgeClass: "bg-sky-100 text-sky-800 border-sky-300",
      containerClass: "border-sky-200 bg-gradient-to-br from-sky-50/80 via-white to-sky-50/30 text-sky-950",
      scoreClass: "text-primary",
      title: "Khá tốt · Đạt chuẩn B2",
    };
  }
  if (score >= 50) {
    return {
      tier: "Cần cải thiện",
      badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
      containerClass: "border-amber-200 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/30 text-amber-950",
      scoreClass: "text-amber-600",
      title: "Cần cải thiện ngữ pháp & từ vựng",
    };
  }
  return {
    tier: "Cần ôn lại",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
    containerClass: "border-rose-200 bg-gradient-to-br from-rose-50/80 via-white to-rose-50/30 text-rose-950",
    scoreClass: "text-rose-600",
    title: "Chưa đạt yêu cầu cấu trúc B2",
  };
}
