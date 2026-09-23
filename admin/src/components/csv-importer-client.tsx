"use client";

import {
  CheckmarkCircle02Icon,
  Copy01Icon,
  Download01Icon,
  EyeIcon,
  FileAttachmentIcon,
  FileUploadIcon,
  InformationCircleIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useState, useTransition } from "react";

import type { ContentKind, CSVImportResult, CSVPreviewResult } from "@/server/csv-importer";

const sampleTemplates: Array<{
  filename: string;
  kind: ContentKind;
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
  content: string;
}> = [
  {
    filename: "quiz-topic-vocabulary.csv",
    kind: "TOPIC_VOCABULARY",
    title: "Từ vựng chuyên đề (Topic Vocabulary)",
    description: "Gồm từ vựng, từ loại, IPA, CEFR, nghĩa tiếng Việt, định nghĩa Anh, collocations, câu ví dụ.",
    badge: "10 Cột chuẩn",
    badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    content: `topic,word,part_of_speech,ipa,cefr_level,meaning_vi,definition_en,collocations,example_sentence,distractors
Environment,biodiversity,noun,/ˌbaɪəʊdaɪˈvɜːsəti/,B2,đa dạng sinh học,the variety of plant and animal life in a particular habitat,preserve biodiversity;loss of biodiversity,Industrial logging has caused irreversible loss of biodiversity in tropical rainforests.,pollution;ecosystem;atmosphere
Environment,renewable,adj,/rɪˈnjuːəbl/,B1,tái tạo được,energy that is not depleted by use,renewable energy;renewable resources,Governments should invest heavily in renewable energy such as solar and wind power.,exhaustible;traditional;fossil
Technology & AI,automation,noun,/ˌɔːtəˈmeɪʃn/,B2,tự động hóa,the use of largely automatic equipment in a manufacturing system,workplace automation;rapid automation,Rapid automation in manufacturing threatens millions of manual jobs.,innovation;computation;digitization
Technology & AI,obsolete,adj,/ˈɒbsəliːt/,C1,lỗi thời,no longer produced or used; out of date,render something obsolete;become obsolete,Advances in AI could render traditional data entry jobs obsolete.,modern;effective;prevalent
Education,curriculum,noun,/kəˈrɪkjələm/,B2,chương trình giảng dạy,the subjects comprising a course of study in a school,core curriculum;revise the curriculum,Schools should incorporate financial literacy into the standard school curriculum.,syllabus;assessment;discipline
Education,pedagogy,noun,/ˈpedədʒɒdʒi/,C1,phương pháp sư phạm,the method and practice of teaching,interactive pedagogy;innovative pedagogy,Modern pedagogy emphasizes student-centered learning over rote memorization.,psychology;philosophy;methodology
Health,sedentary,adj,/ˈsedntri/,B2,ít vận động,tending to spend much time seated; somewhat inactive,sedentary lifestyle;sedentary habits,A sedentary lifestyle is one of the leading contributors to chronic obesity.,active;mobile;dynamic
Health,epidemic,noun,/ˌepɪˈdemɪk/,B2,dịch bệnh bùng phát,a widespread occurrence of an infectious disease in a community,obesity epidemic;combat an epidemic,Health authorities are struggling to curb the global diabetes epidemic.,pandemic;symptom;treatment`,
  },
  {
    filename: "quiz-synonyms.csv",
    kind: "SYNONYM",
    title: "Từ đồng nghĩa nâng cao (Synonyms)",
    description: "Cặp từ gốc và từ thay thế nâng cao, các từ tương đương chấp nhận được và ngữ cảnh sử dụng.",
    badge: "6 Cột chuẩn",
    badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    content: `topic,word,synonym,accepted_synonyms,context,explanation
Academic Verbs,improve,enhance,boost;upgrade,Education can enhance students' critical thinking.,Nâng cao hoặc cải thiện chất lượng
Academic Verbs,solve,resolve,address;tackle,Governments must resolve pressing environmental issues.,Giải quyết triệt để vấn đề
Academic Verbs,cause,trigger,precipitate;provoke,Extreme weather events can trigger severe economic downturns.,Gây ra hoặc châm ngòi cho
Environment,harmful,detrimental,damaging;pernicious,Plastic pollution has a detrimental effect on marine life.,Gây hại nghiêm trọng
Society,advantage,merit,benefit;asset,Remote working possesses numerous merits for both staff and employers.,Ưu điểm hoặc lợi thế
Society,disadvantage,drawback,downside;shortcoming,High cost of living remains a major drawback of megacities.,Bất lợi hoặc nhược điểm
Education,necessary,imperative,essential;vital,Digital literacy is imperative in modern classrooms.,Tối quan trọng và cần thiết`,
  },
  {
    filename: "quiz-collocations.csv",
    kind: "COLLOCATION",
    title: "Cụm từ cố định (Collocations)",
    description: "Cụm collocation tự nhiên, từ khuyết và các phương án gây nhiễu để sinh bài tập trắc nghiệm.",
    badge: "6 Cột chuẩn",
    badgeColor: "bg-sky-50 text-sky-800 border-sky-200",
    content: `topic,collocation,missing_part,distractors,context,meaning_vi
Society & Law,bear the responsibility,bear,take;hold;carry,Citizens must [bear] the responsibility for recycling household waste.,chịu trách nhiệm
Environment,pose a threat to,pose,make;create;bring,Deforestation continues to [pose] a severe threat to biodiversity.,gây ra mối đe dọa cho
Education,bridge the gap,bridge,cross;connect;break,Digital learning tools help [bridge] the educational gap between regions.,thu hẹp khoảng cách
Economy,stimulate economic growth,stimulate,boost;make;do,Tax cuts for startups are designed to [stimulate] economic growth.,kích thích tăng trưởng kinh tế
Technology,keep pace with,pace,step;speed;rate,Traditional laws struggle to keep [pace] with technological breakthroughs.,bắt kịp tốc độ phát triển
Health,take a toll on,toll,bill;cost;harm,Chronic stress can take a heavy [toll] on both mental and physical health.,gây tổn hại nghiêm trọng`,
  },
  {
    filename: "quiz-paraphrase.csv",
    kind: "PARAPHRASE",
    title: "Kỹ thuật Paraphrase (Diễn đạt lại)",
    description: "Mệnh đề gốc, câu diễn đạt lại học thuật, các phương án chấp nhận được và gợi ý tiếng Việt.",
    badge: "6 Cột chuẩn",
    badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
    content: `topic,original_phrase,paraphrased_phrase,accepted_alternatives,context,vietnamese_hint
Technology,young people use smartphones too much,excessive smartphone usage among adolescents,smartphone addiction in the youth;uncontrolled device usage by teens,Studies show that excessive smartphone usage among adolescents leads to poor sleep.,giới trẻ lạm dụng điện thoại
Education,poor students,underprivileged pupils,disadvantaged learners;low-income students,Scholarships should be provided to underprivileged pupils.,học sinh có hoàn cảnh khó khăn
Economy,rich countries,developed economies,affluent nations;high-income nations,Developed economies have a duty to aid developing regions.,các nước phát triển hoặc giàu có
Environment,protect the environment,safeguard the ecosystem,preserve nature;conserve biodiversity,Strict policies are required to safeguard the ecosystem from further industrial damage.,bảo vệ môi trường tự nhiên
Traffic,traffic congestion,vehicular gridlock,severe road congestion;heavy traffic jams,Congestion pricing has successfully reduced vehicular gridlock in central London.,tình trạng ùn tắc giao thông`,
  },
  {
    filename: "quiz-templates.csv",
    kind: "TEMPLATE",
    title: "Mẫu câu & Templates VSTEP/IELTS",
    description: "Khung cấu trúc câu mở bài, thân bài, kết bài kèm từ nối trọng tâm và đoạn văn mẫu điền sẵn.",
    badge: "6 Cột chuẩn",
    badgeColor: "bg-rose-50 text-rose-800 border-rose-200",
    content: `topic,component,template_text,linking_words,sample_filled,target_band
VSTEP Task 2 Opinion,Introduction,"It is widely believed that [Topic]. While some advocate this viewpoint, I am personally convinced that [Counter-opinion] due to [Reason 1] and [Reason 2].","While;due to;personally convinced",It is widely believed that university education should be free. While some advocate this viewpoint, I am personally convinced that tuition fees are necessary due to institutional maintenance and educational quality.,B2-C1
VSTEP Task 2 Discussion,Body 1,"On the one hand, proponents of [Viewpoint A] argue that [Main Argument]. A clear case in point is that [Specific Example]. Consequently, [Result].","On the one hand;proponents of;A clear case in point is that;Consequently",On the one hand, proponents of remote work argue that it offers great flexibility. A clear case in point is that employees save commute time. Consequently, work-life balance is enhanced.,B2
VSTEP Task 2 Discussion,Body 2,"On the other hand, there are persuasive arguments for [Viewpoint B]. Chief among these is that [Core Reason]. Specifically, [Explanation].","On the other hand;Chief among these is;Specifically",On the other hand, there are persuasive arguments for in-person collaboration. Chief among these is that face-to-face interaction fosters creativity. Specifically, impromptu brainstorming sparks innovative ideas.,B2-C1
VSTEP Task 2 Opinion,Conclusion,"In conclusion, although [Acknowledged Counterpoint], I firmly reaffirm that [Main Claim] will ultimately bring superior benefits.","In conclusion;although;firmly reaffirm;ultimately",In conclusion, although free schooling sounds appealing, I firmly reaffirm that modest fees will ultimately bring superior benefits to students.,B2-C1`,
  },
];

export function CSVImporterClient({
  onPreview,
  onImport,
}: {
  onPreview: (csvText: string, kind?: ContentKind) => Promise<CSVPreviewResult>;
  onImport: (csvText: string, kind?: ContentKind) => Promise<CSVImportResult>;
}) {
  const [csvText, setCsvText] = useState("");
  const [selectedKind, setSelectedKind] = useState<ContentKind | "AUTO">("AUTO");
  const [preview, setPreview] = useState<CSVPreviewResult | null>(null);
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [fileName, setFileName] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [inspectModalTemplate, setInspectModalTemplate] = useState<(typeof sampleTemplates)[number] | null>(null);

  function handleFileSelect(file: File) {
    setFileName(file.name);
    setError(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      setCsvText(text);

      startTransition(async () => {
        try {
          const kindParam = selectedKind === "AUTO" ? undefined : selectedKind;
          const res = await onPreview(text, kindParam);
          setPreview(res);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Lỗi đọc file CSV");
        }
      });
    };
    reader.readAsText(file);
  }

  function handleKindChange(kind: ContentKind | "AUTO") {
    setSelectedKind(kind);
    if (!csvText) return;

    startTransition(async () => {
      try {
        const kindParam = kind === "AUTO" ? undefined : kind;
        const res = await onPreview(csvText, kindParam);
        setPreview(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi phân tích cú pháp");
      }
    });
  }

  function loadSampleDirectly(sample: (typeof sampleTemplates)[number]) {
    setCsvText(sample.content);
    setSelectedKind(sample.kind);
    setFileName(sample.filename);
    setError(null);
    setImportResult(null);

    startTransition(async () => {
      try {
        const res = await onPreview(sample.content, sample.kind);
        setPreview(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi phân tích mẫu");
      }
    });
  }

  function copySampleToClipboard(content: string, index: number) {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  function handleExecuteImport() {
    if (!csvText) return;
    setError(null);

    startTransition(async () => {
      try {
        const kindParam = selectedKind === "AUTO" ? preview?.kind : selectedKind;
        const res = await onImport(csvText, kindParam);
        setImportResult(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Lỗi trong quá trình import");
      }
    });
  }

  return (
    <div className="space-y-8 mt-6">
      {/* LOADING OVERLAY KHI ĐANG IMPORT */}
      {isPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in-0">
          <div className="rounded-3xl bg-white p-8 shadow-2xl text-center space-y-4 max-w-md w-full border border-slate-100 animate-in zoom-in-95">
            <div className="mx-auto size-14 animate-spin rounded-full border-4 border-amber-200 border-t-[var(--amber)]" />
            <h3 className="text-lg font-extrabold text-[var(--ink)]">
              Đang xử lý Import Dữ liệu...
            </h3>
            <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
              Hệ thống đang phân tích các dòng CSV, tự động tạo Chuyên mục, Chủ đề và lưu các câu hỏi vào cơ sở dữ liệu. Vui lòng đợi trong giây lát!
            </p>
          </div>
        </div>
      )}

      {/* POPUP THÀNH CÔNG RỰC RỠ KHI IMPORT XONG */}
      {importResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in-0">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white p-7 sm:p-8 shadow-2xl text-center space-y-5 border border-slate-100 animate-in zoom-in-95">
            <div className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-100 text-emerald-700 shadow-inner">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={44} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-[var(--ink)]">
                Import Dữ Liệu Thành Công!
              </h3>
              <p className="mt-2 text-sm text-[var(--ink-soft)] leading-relaxed">
                Đã tạo thành công <strong className="text-emerald-700 text-base">{importResult.lessonsCreated} bài học mới</strong>{" "}
                với tổng cộng <strong className="text-emerald-700 text-base">{importResult.exercisesCreated} câu hỏi thực hành</strong>{" "}
                (thuộc {importResult.topicsCreated} chủ đề mới) vào hệ thống dưới dạng Bản nháp (`DRAFT`).
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-3 border-t border-slate-100">
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--navy)] px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-[var(--navy-bright)] transition"
                href="/lessons"
              >
                Xem danh sách bài học ngay →
              </Link>
              <button
                className="rounded-xl border border-[var(--line)] bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                onClick={() => {
                  setImportResult(null);
                  setPreview(null);
                  setCsvText("");
                  setFileName(null);
                }}
                type="button"
              >
                Import tiếp file khác
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. KHU VỰC TẢI & XEM MẪU CSV CHUẨN */}
      <section className="admin-panel p-6 sm:p-7 bg-white shadow-xs border border-[var(--line)]">
        <div className="flex items-center gap-3 border-b border-[var(--line)] pb-4">
          <div className="grid size-10 place-items-center rounded-xl bg-sky-50 text-[var(--navy)]">
            <HugeiconsIcon icon={Download01Icon} size={20} strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--ink)]">
              Mẫu Template CSV Chuẩn (5 Loại nội dung)
            </h2>
            <p className="text-xs text-[var(--ink-soft)]">
              Bấm &ldquo;Xem & Thử ngay&rdquo; để nạp dữ liệu mẫu vào trình phân tích, hoặc &ldquo;Tải file&rdquo; để nhập liệu trên Excel.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sampleTemplates.map((item, idx) => (
            <div
              key={item.filename}
              className="flex flex-col justify-between rounded-2xl border border-[var(--line)] bg-[#faf8f2] p-4 transition hover:border-[var(--navy-bright)] hover:shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--ink-soft)]">
                    {item.filename}
                  </span>
                </div>
                <h3 className="mt-2 text-sm font-bold text-[var(--ink)]">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs text-[var(--ink-soft)] line-clamp-2">
                  {item.description}
                </p>
              </div>

              <div className="mt-4 flex flex-col gap-2 pt-3 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <button
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[var(--navy)] px-3 py-2 text-xs font-bold text-white hover:bg-[var(--navy-bright)] transition"
                    onClick={() => loadSampleDirectly(item)}
                    type="button"
                  >
                    <HugeiconsIcon icon={SparklesIcon} size={15} />
                    Nạp thử mẫu này
                  </button>
                  <button
                    className="inline-flex items-center justify-center rounded-xl border border-[var(--line)] bg-white p-2 text-xs font-semibold text-[var(--ink)] hover:bg-slate-100 transition"
                    onClick={() => setInspectModalTemplate(item)}
                    title="Xem chi tiết nội dung mẫu"
                    type="button"
                  >
                    <HugeiconsIcon icon={EyeIcon} size={16} />
                  </button>
                  <button
                    className="inline-flex items-center justify-center rounded-xl border border-[var(--line)] bg-white p-2 text-xs font-semibold text-[var(--ink)] hover:bg-slate-100 transition"
                    onClick={() => copySampleToClipboard(item.content, idx)}
                    title="Sao chép toàn bộ CSV"
                    type="button"
                  >
                    {copiedIndex === idx ? (
                      <span className="text-[10px] text-emerald-600 font-bold">✓</span>
                    ) : (
                      <HugeiconsIcon icon={Copy01Icon} size={16} />
                    )}
                  </button>
                </div>

                <a
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-[var(--ink)] hover:bg-slate-50 transition"
                  download={item.filename}
                  href={`/templates/${item.filename}`}
                >
                  <HugeiconsIcon icon={Download01Icon} size={14} />
                  Tải file (.csv) về máy
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MODAL XEM CHI TIẾT NỘI DUNG MẪU */}
      {inspectModalTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in-0">
          <div className="relative max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-4 bg-[#faf8f2]">
              <div>
                <h3 className="font-heading text-base font-bold text-[var(--ink)]">
                  {inspectModalTemplate.title}
                </h3>
                <p className="font-mono text-xs text-[var(--ink-soft)]">
                  {inspectModalTemplate.filename}
                </p>
              </div>
              <button
                className="grid size-8 place-items-center rounded-full bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
                onClick={() => setInspectModalTemplate(null)}
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--ink-soft)]">Nội dung thô (Raw CSV):</span>
                <button
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--line)] bg-slate-50 px-3 py-1 text-xs font-semibold hover:bg-slate-100"
                  onClick={() => {
                    navigator.clipboard.writeText(inspectModalTemplate.content);
                    alert("Đã sao chép nội dung template CSV vào bộ nhớ tạm!");
                  }}
                  type="button"
                >
                  <HugeiconsIcon icon={Copy01Icon} size={14} />
                  Sao chép toàn bộ CSV
                </button>
              </div>
              <pre className="max-h-96 overflow-x-auto rounded-xl border border-[var(--line)] bg-[#0d1b3e] p-4 font-mono text-xs text-[#cad5ed] leading-5">
                {inspectModalTemplate.content}
              </pre>
            </div>

            <div className="border-t border-[var(--line)] bg-slate-50 px-6 py-3 flex justify-end gap-3">
              <button
                className="rounded-xl bg-[var(--amber)] px-5 py-2 text-xs font-bold text-[#392800] hover:bg-[#e49400] transition"
                onClick={() => {
                  loadSampleDirectly(inspectModalTemplate);
                  setInspectModalTemplate(null);
                }}
                type="button"
              >
                Nạp mẫu này vào form import
              </button>
              <button
                className="rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                onClick={() => setInspectModalTemplate(null)}
                type="button"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. KHU VỰC TẢI LÊN HOẶC DÁN CSV */}
      <section className="admin-panel p-6 sm:p-7 bg-white shadow-xs border border-[var(--line)]">
        <div className="flex items-center gap-3 border-b border-[var(--line)] pb-4">
          <div className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-700">
            <HugeiconsIcon icon={FileUploadIcon} size={20} strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--ink)]">
              Tải lên hoặc Dán nội dung File CSV
            </h2>
            <p className="text-xs text-[var(--ink-soft)]">
              Hệ thống sẽ tự động phát hiện loại bài học và gom nhóm các dòng cùng Topic thành từng bài học.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800">
            ✕ {error}
          </div>
        )}

        {/* Success Alert */}
        {importResult && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
            <div className="flex items-center gap-2 text-sm font-bold">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} />
              Import dữ liệu thành công!
            </div>
            <p className="mt-2 text-xs">
              Đã tạo thành công <strong>{importResult.lessonsCreated} bài học mới</strong> (gồm{" "}
              <strong>{importResult.exercisesCreated} câu hỏi thực hành</strong>) dưới dạng Bản nháp (`DRAFT`).
            </p>
            <div className="mt-4 flex gap-3">
              <Link
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--navy)] px-4 py-2 text-xs font-bold text-white shadow-xs"
                href="/lessons"
              >
                Xem danh sách bài học →
              </Link>
              <button
                className="rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                onClick={() => {
                  setImportResult(null);
                  setPreview(null);
                  setCsvText("");
                  setFileName(null);
                }}
                type="button"
              >
                Import file khác
              </button>
            </div>
          </div>
        )}

        <div className="mt-5 grid gap-5 lg:grid-cols-12">
          {/* Dropzone & file input */}
          <div className="lg:col-span-6 space-y-4">
            <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--line)] bg-[#faf8f2] p-8 text-center cursor-pointer hover:border-[var(--navy-bright)] hover:bg-white transition">
              <HugeiconsIcon icon={FileAttachmentIcon} size={36} className="text-[var(--navy-bright)] mb-2" />
              <span className="text-sm font-bold text-[var(--ink)]">
                {fileName ? fileName : "Bấm để chọn file CSV hoặc kéo thả vào đây"}
              </span>
              <span className="mt-1 text-xs text-[var(--ink-soft)]">
                Hỗ trợ định dạng .csv với bảng mã UTF-8
              </span>
              <input
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                type="file"
              />
            </label>

            {/* Chọn loại nội dung ghi đè nếu muốn */}
            <div>
              <label className="block text-xs font-bold text-[var(--ink)] mb-1.5">
                Xác định loại bài học:
              </label>
              <select
                className="h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm outline-none transition focus:border-[var(--navy-bright)]"
                onChange={(e) => handleKindChange(e.target.value as ContentKind | "AUTO")}
                value={selectedKind}
              >
                <option value="AUTO">✨ Tự động nhận diện theo tên cột (Khuyên dùng)</option>
                <option value="TOPIC_VOCABULARY">Topic Vocabulary (Từ vựng chuyên đề)</option>
                <option value="SYNONYM">Synonym (Từ đồng nghĩa)</option>
                <option value="COLLOCATION">Collocation (Cụm từ cố định)</option>
                <option value="PARAPHRASE">Paraphrase (Diễn đạt lại)</option>
                <option value="TEMPLATE">Template (Mẫu câu & Khung bài)</option>
              </select>
            </div>
          </div>

          {/* Dán raw text */}
          <div className="lg:col-span-6 flex flex-col">
            <label className="block text-xs font-bold text-[var(--ink)] mb-1.5">
              Hoặc dán trực tiếp dữ liệu CSV dạng văn bản:
            </label>
            <textarea
              className="flex-1 min-h-[160px] w-full rounded-2xl border border-[var(--line)] bg-white p-3 font-mono text-xs leading-5 outline-none transition focus:border-[var(--navy-bright)]"
              onChange={(e) => {
                const text = e.target.value;
                setCsvText(text);
                setFileName(null);
                if (text.trim().length > 10) {
                  startTransition(async () => {
                    try {
                      const kindParam = selectedKind === "AUTO" ? undefined : selectedKind;
                      const res = await onPreview(text, kindParam);
                      setPreview(res);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Lỗi cú pháp");
                    }
                  });
                }
              }}
              placeholder={`topic,word,part_of_speech,ipa,cefr_level,meaning_vi,definition_en,collocations,example_sentence,distractors\nEnvironment,biodiversity,noun,/.../,B2,đa dạng sinh học,...`}
              value={csvText}
            />
          </div>
        </div>
      </section>

      {/* 3. KHU VỰC PREVIEW DỮ LIỆU */}
      {preview && !importResult && (
        <section className="admin-panel p-6 sm:p-7 bg-white shadow-xs border border-[var(--line)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--line)] pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900 border border-amber-300">
                  Phát hiện: {preview.kind}
                </span>
                <span className="text-xs text-[var(--ink-soft)] font-mono">
                  {preview.rowCount} dòng dữ liệu · {preview.estimatedLessons} chủ đề
                </span>
              </div>
              <h2 className="mt-1 text-base sm:text-lg font-bold text-[var(--ink)]">
                Xem trước Dữ liệu Phân tích
              </h2>
            </div>

            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--amber)] px-6 text-sm font-extrabold text-[#392800] shadow-[0_8px_20px_rgba(245,184,46,.25)] hover:bg-[#e49400] transition disabled:opacity-50"
              disabled={isPending}
              onClick={handleExecuteImport}
              type="button"
            >
              <HugeiconsIcon icon={SparklesIcon} size={18} strokeWidth={2.5} />
              {isPending ? "Đang xử lý import…" : "🚀 Thực hiện Import vào Hệ thống"}
            </button>
          </div>

          {/* Topics detected */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[var(--ink-soft)]">Chủ đề nhận diện được:</span>
            {preview.topicsFound.map((top) => (
              <span
                key={top}
                className="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs font-semibold text-slate-800 border border-slate-200"
              >
                {top}
              </span>
            ))}
          </div>

          {/* Sample Rows Table */}
          <div className="mt-5 overflow-x-auto rounded-xl border border-[var(--line)]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#faf8f2] border-b border-[var(--line)] text-[var(--ink-soft)] font-bold">
                <tr>
                  <th className="p-3 w-12 text-center">#</th>
                  {preview.headers.slice(0, 6).map((h) => (
                    <th key={h} className="p-3 font-mono uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {preview.sampleRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="p-3 text-center text-muted-foreground font-mono font-bold">
                      {idx + 1}
                    </td>
                    {preview.headers.slice(0, 6).map((h) => (
                      <td key={h} className="p-3 max-w-[220px] truncate text-[var(--ink)]">
                        {row[h] || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 border-t border-[var(--line)] pt-3">
            <p className="text-[11px] text-[var(--ink-soft)] italic">
              * Hiển thị tối đa 5 dòng đầu tiên để xem trước cấu trúc. Khi bấm nút &ldquo;Thực hiện Import&rdquo; ở góc trên, hệ thống sẽ tự động tạo toàn bộ {preview.rowCount} câu hỏi ({preview.estimatedLessons} chủ đề).
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
