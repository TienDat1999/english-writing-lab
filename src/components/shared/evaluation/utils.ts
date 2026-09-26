import type { ScoreTier } from "./types";

export function parsePatternTip(raw: string) {
  if (!raw) return { pattern: "", explanation: "", tokens: [] as string[] };
  let cleaned = raw.trim();
  // Strip leading markdown prefixes and "Cấu trúc:" / "Cấu trúc "
  cleaned = cleaned.replace(/^[\s*\-#>*]*Cấu trúc\s*[:\-\s]*/i, "");
  cleaned = cleaned.replace(/^[\s*\-#>:]+/, "");

  let pattern = cleaned;
  let explanation = "";

  // Check format: "pattern" or “pattern” followed by explanation
  const quoteMatch = cleaned.match(/^["“]([^"”]+)["”]\s*([\s\S]*)$/);
  if (quoteMatch) {
    pattern = quoteMatch[1].trim();
    explanation = quoteMatch[2].replace(/^\(([\s\S]*)\)$/, "$1").trim();
  } else {
    // Check format: pattern (explanation)
    const parenMatch = cleaned.match(/^([\s\S]*?)(?:\s*\(([^()]+)\))\s*$/);
    if (parenMatch) {
      pattern = parenMatch[1].trim();
      explanation = parenMatch[2].trim();
    } else {
      // Look for boundary where Vietnamese explanation starts (e.g. after sentence ending followed by Vietnamese characters)
      const splitMatch = cleaned.match(/^([\s\S]*?[.!?])\s+([A-ZÀ-Ỹa-zà-ỹ][\s\S]*)$/);
      if (splitMatch && /[à-ỹ]/i.test(splitMatch[2])) {
        pattern = splitMatch[1].trim();
        explanation = splitMatch[2].trim();
      }
    }
  }

  // Clean trailing/leading quotes from pattern
  pattern = pattern.replace(/^["“]+|["”]+$/g, "").trim();
  // Clean any leading punctuation from explanation
  explanation = explanation.replace(/^[.\-:\s]+/, "").trim();

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
