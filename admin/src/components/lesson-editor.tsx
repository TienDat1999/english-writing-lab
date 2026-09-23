"use client";

import {
  cefrLevels,
  contentAccessTiers,
  contentAudiences,
  contentVisibilities,
  evaluationModes,
  exerciseTypes,
  ieltsModules,
  ieltsSkillAreas,
  lessonTypesForSkill,
  primarySkills,
  type CreateLessonDraftInput,
  type ExerciseDraftInput,
  type PrimarySkill,
} from "@draftwise/content";
import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowUp01Icon,
  CheckmarkCircle02Icon,
  Delete02Icon,
  DragDropVerticalIcon,
  FloppyDiskIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import {
  initialLessonEditorActionState,
  type LessonEditorActionState,
} from "./lesson-editor-types";
import { LessonPreviewDialog } from "./lesson-preview-dialog";

type LessonEditorValue = CreateLessonDraftInput & {
  lessonId?: string;
  revision?: number;
  versionId?: string;
  versionNumber?: number;
};

type SaveAction = (
  state: LessonEditorActionState,
  formData: FormData,
) => Promise<LessonEditorActionState>;

const skillLabels: Record<string, string> = {
  LISTENING: "Listening",
  SPEAKING: "Speaking",
  VOCABULARY: "Vocabulary",
  WRITING: "Writing",
};

const fieldClass = "mt-2 h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm outline-none focus:border-[var(--navy-bright)] focus:ring-2 focus:ring-[#1959c71a]";
const textAreaClass = "mt-2 min-h-24 w-full resize-y rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm leading-6 outline-none focus:border-[var(--navy-bright)] focus:ring-2 focus:ring-[#1959c71a]";

function emptyExercise(position: number): ExerciseDraftInput {
  return {
    position,
    exerciseType: "TYPE_ANSWER",
    evaluationMode: "NORMALIZED",
    localizations: [
      { locale: "vi", instruction: "", promptText: "", hintText: "", explanationText: "" },
      { locale: "en", instruction: "", promptText: "", hintText: "", explanationText: "" },
    ],
    targetContent: "",
    contextText: "",
    choices: [],
    answerRubric: {
      correctAnswer: null,
      acceptedAnswers: [],
      requiredExpression: null,
      grammarWeight: null,
      meaningWeight: null,
      minimumScore: null,
      aiRubricVersion: null,
      rules: null,
    },
    mediaAssetIds: [],
    estimatedSeconds: 60,
    isOptional: false,
    isPreview: false,
  };
}

function lines(value: string) {
  return value.split("\n").map((entry) => entry.trim()).filter(Boolean);
}

function csv(value: string) {
  return value.split(",").map((entry) => entry.trim()).filter(Boolean);
}

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <label className="block text-sm font-bold text-[var(--ink)]">
      {children}
      {hint && <span className="ml-2 text-xs font-medium text-[var(--ink-soft)]">{hint}</span>}
    </label>
  );
}

function localization(value: CreateLessonDraftInput, locale: "vi" | "en") {
  return value.localizations.find((entry) => entry.locale === locale)!;
}

function exerciseLocalization(value: ExerciseDraftInput, locale: "vi" | "en") {
  return value.localizations.find((entry) => entry.locale === locale)!;
}

export function LessonEditor({
  initialValue,
  mode,
  savedMessage,
  saveAction,
  topics,
}: {
  initialValue: LessonEditorValue;
  mode: "create" | "edit";
  savedMessage?: string;
  saveAction: SaveAction;
  topics: Array<{ id: string; label: string }>;
}) {
  const [value, setValue] = useState(initialValue);
  const [state, formAction, pending] = useActionState(saveAction, initialLessonEditorActionState);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const lessonTypeOptions = useMemo(
    () => lessonTypesForSkill(value.primarySkill),
    [value.primarySkill],
  );

  function patch(next: Partial<CreateLessonDraftInput>) {
    setValue((current) => ({ ...current, ...next }));
  }

  function patchLocalization(locale: "vi" | "en", next: Partial<CreateLessonDraftInput["localizations"][number]>) {
    patch({
      localizations: value.localizations.map((entry) =>
        entry.locale === locale ? { ...entry, ...next } : entry,
      ),
    });
  }

  function patchExercise(index: number, next: Partial<ExerciseDraftInput>) {
    patch({
      exercises: value.exercises.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, ...next } : entry,
      ),
    });
  }

  function patchExerciseLocalization(
    index: number,
    locale: "vi" | "en",
    next: Partial<ExerciseDraftInput["localizations"][number]>,
  ) {
    const exercise = value.exercises[index];
    patchExercise(index, {
      localizations: exercise.localizations.map((entry) =>
        entry.locale === locale ? { ...entry, ...next } : entry,
      ),
    });
  }

  function reorder(from: number, to: number) {
    if (from === to || to < 0 || to >= value.exercises.length) return;
    const next = [...value.exercises];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    patch({ exercises: next.map((entry, position) => ({ ...entry, position })) });
  }

  const payload = JSON.stringify({
    ...value,
    revision: state.revision ?? value.revision,
    exercises: value.exercises.map((exercise, position) => ({ ...exercise, position })),
  });

  return (
    <form action={formAction} className="pb-28">
      <input name="payload" type="hidden" value={payload} />
      <div className="sticky top-[4.25rem] z-20 -mx-4 mt-6 border-y border-[var(--line)] bg-[#f3f0e8e8] px-4 py-3 backdrop-blur sm:-mx-7 sm:px-7 lg:top-0">
        <div className="mx-auto flex max-w-[90rem] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3 text-sm font-bold" href="/lessons">
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} strokeWidth={2} />
              Danh sách
            </Link>
            <div className="hidden sm:block">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--ink-soft)]">{mode === "create" ? "Draft mới" : `Version ${value.versionNumber}.${state.revision ?? value.revision}`}</p>
              <p className="text-sm font-extrabold">{localization(value, "vi").title || localization(value, "en").title || "Chưa đặt tên"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LessonPreviewDialog
              value={value}
              versionLabel={mode === "create" ? "Draft mới" : `Version ${value.versionNumber}.${state.revision ?? value.revision}`}
            />
            <button className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--navy)] px-5 text-sm font-extrabold text-white shadow-[0_8px_24px_rgba(16,46,114,.2)] disabled:cursor-wait disabled:opacity-60" disabled={pending} type="submit">
              <HugeiconsIcon icon={FloppyDiskIcon} size={19} strokeWidth={2} />
              {pending ? "Đang lưu…" : "Lưu bản nháp"}
            </button>
          </div>
        </div>
      </div>

      {(savedMessage || state.status !== "idle") && (
        <div className={`mt-5 rounded-2xl border px-5 py-4 text-sm ${state.status === "error" ? "border-[#e9c5bb] bg-[#fff0ec] text-[#8b352e]" : "border-[#a9d7bb] bg-[#e7f5ec] text-[#236143]"}`}>
          <p className="flex items-center gap-2 font-bold">
            {state.status !== "error" && <HugeiconsIcon icon={CheckmarkCircle02Icon} size={19} strokeWidth={2} />}
            {state.message || savedMessage}
          </p>
          {state.issues && <ul className="mt-2 list-disc space-y-1 pl-5 font-medium">{state.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>}
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <section className="admin-panel p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="admin-kicker text-[var(--navy-bright)]">01 · Identity</p>
                <h2 className="mt-2 text-xl font-extrabold">Tên và đường dẫn</h2>
              </div>
              <span className="rounded-full bg-[#fff1c8] px-3 py-1 text-xs font-bold">Song ngữ</span>
            </div>
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {(["vi", "en"] as const).map((locale) => {
                const entry = localization(value, locale);
                const slug = value.slugs.find((item) => item.locale === locale)?.slug ?? "";
                return (
                  <div className="rounded-2xl border border-[var(--line)] bg-[#f8f6ef] p-4" key={locale}>
                    <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--ink-soft)]">{locale === "vi" ? "Tiếng Việt" : "English"}</p>
                    <div className="mt-4">
                      <Label>Tiêu đề</Label>
                      <input className={fieldClass} maxLength={200} onChange={(event) => patchLocalization(locale, { title: event.target.value })} value={entry.title} />
                    </div>
                    <div className="mt-4">
                      <Label hint={mode === "edit" ? "không đổi sau khi tạo" : undefined}>Slug</Label>
                      <input className={fieldClass} disabled={mode === "edit"} maxLength={160} onChange={(event) => patch({ slugs: value.slugs.map((item) => item.locale === locale ? { ...item, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/gu, "-").replace(/-+/gu, "-").replace(/^-|-$/gu, "") } : item) })} value={slug} />
                    </div>
                    <div className="mt-4">
                      <Label>Mô tả ngắn</Label>
                      <textarea className={textAreaClass} maxLength={500} onChange={(event) => patchLocalization(locale, { shortDescription: event.target.value })} value={entry.shortDescription} />
                    </div>
                    <div className="mt-4">
                      <Label hint="mỗi dòng một mục tiêu">Learning objectives</Label>
                      <textarea className={textAreaClass} onChange={(event) => patchLocalization(locale, { learningObjectives: lines(event.target.value) })} value={entry.learningObjectives.join("\n")} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="admin-panel p-5 sm:p-7">
            <p className="admin-kicker text-[var(--navy-bright)]">02 · Learning design</p>
            <h2 className="mt-2 text-xl font-extrabold">Phân loại và đối tượng học</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Label>Kỹ năng
                <select className={fieldClass} onChange={(event) => {
                  const primarySkill = event.target.value as PrimarySkill;
                  patch({ primarySkill, lessonType: lessonTypesForSkill(primarySkill)[0] });
                }} value={value.primarySkill}>
                  {primarySkills.map((skill) => <option key={skill} value={skill}>{skillLabels[skill]}</option>)}
                </select>
              </Label>
              <Label>Loại bài học
                <select className={fieldClass} onChange={(event) => patch({ lessonType: event.target.value as CreateLessonDraftInput["lessonType"] })} value={value.lessonType}>
                  {lessonTypeOptions.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}
                </select>
              </Label>
              <Label>Ngôn ngữ học
                <input className={fieldClass} maxLength={16} onChange={(event) => patch({ learningLanguage: event.target.value })} value={value.learningLanguage} />
              </Label>
              <Label>CEFR thấp nhất
                <select className={fieldClass} onChange={(event) => patch({ cefrLevelMin: event.target.value as CreateLessonDraftInput["cefrLevelMin"] })} value={value.cefrLevelMin}>{cefrLevels.map((level) => <option key={level}>{level}</option>)}</select>
              </Label>
              <Label>CEFR cao nhất
                <select className={fieldClass} onChange={(event) => patch({ cefrLevelMax: event.target.value as CreateLessonDraftInput["cefrLevelMax"] })} value={value.cefrLevelMax}>{cefrLevels.map((level) => <option key={level}>{level}</option>)}</select>
              </Label>
              <Label>Thời lượng (phút)
                <input className={fieldClass} min={1} max={600} onChange={(event) => patch({ estimatedMinutes: Number(event.target.value) })} type="number" value={value.estimatedMinutes} />
              </Label>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-bold text-[var(--ink)]">Topic chính</label>
                  <a
                    className="text-[11px] font-bold text-[var(--navy-bright)] hover:underline"
                    href="/categories"
                    target="_blank"
                    rel="noreferrer"
                  >
                    + Thêm Topic mới ↗
                  </a>
                </div>
                <select className={fieldClass} onChange={(event) => patch({ primaryTopicId: event.target.value })} value={value.primaryTopicId}>
                  {topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.label}</option>)}
                </select>
              </div>
              <Label>Visibility
                <select className={fieldClass} onChange={(event) => patch({ visibility: event.target.value as CreateLessonDraftInput["visibility"] })} value={value.visibility}>{contentVisibilities.map((item) => <option key={item}>{item}</option>)}</select>
              </Label>
              <Label>Access tier
                <select className={fieldClass} onChange={(event) => patch({ accessTier: event.target.value as CreateLessonDraftInput["accessTier"] })} value={value.accessTier}>{contentAccessTiers.map((item) => <option key={item}>{item}</option>)}</select>
              </Label>
              <div className="sm:col-span-2 lg:col-span-3">
                <Label hint="phân cách bằng dấu phẩy">Tags
                  <input className={fieldClass} onChange={(event) => patch({ tagCodes: csv(event.target.value) })} value={value.tagCodes.join(", ")} />
                </Label>
              </div>
            </div>
            <fieldset className="mt-6 border-t border-[var(--line)] pt-5">
              <legend className="text-sm font-bold">Audience</legend>
              <div className="mt-3 flex flex-wrap gap-3">
                {contentAudiences.map((audience) => <label className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold" key={audience}><input checked={value.audiences.includes(audience)} className="accent-[var(--navy)]" onChange={(event) => patch({ audiences: event.target.checked ? [...value.audiences, audience] : value.audiences.filter((item) => item !== audience) })} type="checkbox" />{audience.replaceAll("_", " ")}</label>)}
              </div>
            </fieldset>
            {value.audiences.some((audience) => audience.startsWith("IELTS_")) && (
              <div className="mt-5 grid gap-5 rounded-2xl bg-[#e8eef8] p-4 sm:grid-cols-2 lg:grid-cols-4">
                <Label>Band min<input className={fieldClass} max={9} min={0} step={0.5} type="number" value={value.ieltsMetadata?.bandMin ?? ""} onChange={(event) => patch({ ieltsMetadata: { bandMin: event.target.value ? Number(event.target.value) : null, bandMax: value.ieltsMetadata?.bandMax ?? null, module: value.ieltsMetadata?.module ?? null, skillArea: value.ieltsMetadata?.skillArea ?? null } })} /></Label>
                <Label>Band max<input className={fieldClass} max={9} min={0} step={0.5} type="number" value={value.ieltsMetadata?.bandMax ?? ""} onChange={(event) => patch({ ieltsMetadata: { bandMin: value.ieltsMetadata?.bandMin ?? null, bandMax: event.target.value ? Number(event.target.value) : null, module: value.ieltsMetadata?.module ?? null, skillArea: value.ieltsMetadata?.skillArea ?? null } })} /></Label>
                <Label>Module<select className={fieldClass} value={value.ieltsMetadata?.module ?? ""} onChange={(event) => patch({ ieltsMetadata: { bandMin: value.ieltsMetadata?.bandMin ?? null, bandMax: value.ieltsMetadata?.bandMax ?? null, module: event.target.value ? event.target.value as typeof ieltsModules[number] : null, skillArea: value.ieltsMetadata?.skillArea ?? null } })}><option value="">Chọn</option>{ieltsModules.map((item) => <option key={item}>{item}</option>)}</select></Label>
                <Label>Skill area<select className={fieldClass} value={value.ieltsMetadata?.skillArea ?? ""} onChange={(event) => patch({ ieltsMetadata: { bandMin: value.ieltsMetadata?.bandMin ?? null, bandMax: value.ieltsMetadata?.bandMax ?? null, module: value.ieltsMetadata?.module ?? null, skillArea: event.target.value ? event.target.value as typeof ieltsSkillAreas[number] : null } })}><option value="">Chọn</option>{ieltsSkillAreas.map((item) => <option key={item}>{item}</option>)}</select></Label>
              </div>
            )}
          </section>

          <section className="admin-panel overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] p-5 sm:p-7">
              <div>
                <p className="admin-kicker text-[var(--navy-bright)]">03 · Practice</p>
                <h2 className="mt-2 text-xl font-extrabold">Exercise builder</h2>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">Kéo thả hoặc dùng mũi tên để đổi thứ tự. Position được tính lại tự động.</p>
              </div>
              <button className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--amber)] px-4 text-sm font-extrabold text-[#392800]" onClick={() => patch({ exercises: [...value.exercises, emptyExercise(value.exercises.length)] })} type="button"><HugeiconsIcon icon={Add01Icon} size={19} strokeWidth={2} />Thêm bài tập</button>
            </div>
            {value.exercises.length === 0 ? (
              <div className="px-6 py-14 text-center"><p className="font-bold">Chưa có bài tập</p><p className="mt-2 text-sm text-[var(--ink-soft)]">Draft có thể lưu trước, nhưng cần ít nhất một bài tập trước khi publish.</p></div>
            ) : (
              <div className="space-y-4 bg-[#f7f4ec] p-4 sm:p-6">
                {value.exercises.map((exercise, index) => (
                  <details className="rounded-2xl border border-[var(--line)] bg-white shadow-sm" draggable key={`${exercise.position}-${index}`} onDragStart={() => setDraggedIndex(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggedIndex !== null) reorder(draggedIndex, index); setDraggedIndex(null); }}>
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4 sm:px-5">
                      <HugeiconsIcon className="text-[var(--ink-soft)]" icon={DragDropVerticalIcon} size={20} strokeWidth={2} />
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--navy)] text-xs font-extrabold text-white">{index + 1}</span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-extrabold">{exerciseLocalization(exercise, "vi").promptText || exerciseLocalization(exercise, "en").promptText || "Bài tập chưa có prompt"}</span><span className="mt-1 block text-xs text-[var(--ink-soft)]">{exercise.exerciseType.replaceAll("_", " ")} · {exercise.evaluationMode.replaceAll("_", " ")}</span></span>
                      <span className="flex gap-1" onClick={(event) => event.preventDefault()}>
                        <button aria-label="Di chuyển lên" className="grid size-9 place-items-center rounded-lg border border-[var(--line)]" disabled={index === 0} onClick={() => reorder(index, index - 1)} type="button"><HugeiconsIcon icon={ArrowUp01Icon} size={17} /></button>
                        <button aria-label="Di chuyển xuống" className="grid size-9 place-items-center rounded-lg border border-[var(--line)]" disabled={index === value.exercises.length - 1} onClick={() => reorder(index, index + 1)} type="button"><HugeiconsIcon icon={ArrowDown01Icon} size={17} /></button>
                        <button aria-label="Xoá bài tập" className="grid size-9 place-items-center rounded-lg border border-[#e8c4c0] text-[var(--danger)]" onClick={() => patch({ exercises: value.exercises.filter((_, entryIndex) => entryIndex !== index).map((entry, position) => ({ ...entry, position })) })} type="button"><HugeiconsIcon icon={Delete02Icon} size={17} /></button>
                      </span>
                    </summary>
                    <div className="border-t border-[var(--line)] p-4 sm:p-5">
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <Label>Loại bài tập<select className={fieldClass} onChange={(event) => patchExercise(index, { exerciseType: event.target.value as ExerciseDraftInput["exerciseType"] })} value={exercise.exerciseType}>{exerciseTypes.map((item) => <option key={item}>{item}</option>)}</select></Label>
                        <Label>Cách chấm<select className={fieldClass} onChange={(event) => patchExercise(index, { evaluationMode: event.target.value as ExerciseDraftInput["evaluationMode"] })} value={exercise.evaluationMode}>{evaluationModes.map((item) => <option key={item}>{item}</option>)}</select></Label>
                        <Label>Thời gian (giây)<input className={fieldClass} min={1} max={3600} type="number" value={exercise.estimatedSeconds ?? ""} onChange={(event) => patchExercise(index, { estimatedSeconds: event.target.value ? Number(event.target.value) : null })} /></Label>
                      </div>
                      <div className="mt-5 grid gap-4 lg:grid-cols-2">
                        {(["vi", "en"] as const).map((locale) => {
                          const entry = exerciseLocalization(exercise, locale);
                          return <div className="rounded-xl bg-[#f7f4ec] p-4" key={locale}><p className="text-xs font-extrabold uppercase tracking-[0.1em] text-[var(--ink-soft)]">{locale.toUpperCase()}</p><div className="mt-3"><Label>Prompt<textarea className={textAreaClass} value={entry.promptText} onChange={(event) => patchExerciseLocalization(index, locale, { promptText: event.target.value })} /></Label></div><div className="mt-3"><Label>Hướng dẫn<input className={fieldClass} value={entry.instruction} onChange={(event) => patchExerciseLocalization(index, locale, { instruction: event.target.value })} /></Label></div><div className="mt-3"><Label>Gợi ý<input className={fieldClass} value={entry.hintText} onChange={(event) => patchExerciseLocalization(index, locale, { hintText: event.target.value })} /></Label></div><div className="mt-3"><Label>Giải thích<textarea className={textAreaClass} value={entry.explanationText} onChange={(event) => patchExerciseLocalization(index, locale, { explanationText: event.target.value })} /></Label></div></div>;
                        })}
                      </div>
                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <Label>Target content<textarea className={textAreaClass} value={exercise.targetContent} onChange={(event) => patchExercise(index, { targetContent: event.target.value })} /></Label>
                        <Label>Context<textarea className={textAreaClass} value={exercise.contextText} onChange={(event) => patchExercise(index, { contextText: event.target.value })} /></Label>
                        <Label hint="mỗi dòng một lựa chọn">Choices<textarea className={textAreaClass} value={exercise.choices.join("\n")} onChange={(event) => patchExercise(index, { choices: lines(event.target.value) })} /></Label>
                        <Label>Đáp án đúng<textarea className={textAreaClass} value={exercise.answerRubric.correctAnswer ?? ""} onChange={(event) => patchExercise(index, { answerRubric: { ...exercise.answerRubric, correctAnswer: event.target.value.trim() ? event.target.value : null } })} /></Label>
                        <Label hint="mỗi dòng một đáp án">Accepted answers<textarea className={textAreaClass} value={exercise.answerRubric.acceptedAnswers.join("\n")} onChange={(event) => patchExercise(index, { answerRubric: { ...exercise.answerRubric, acceptedAnswers: lines(event.target.value) } })} /></Label>
                        <Label>Required expression<input className={fieldClass} value={exercise.answerRubric.requiredExpression ?? ""} onChange={(event) => patchExercise(index, { answerRubric: { ...exercise.answerRubric, requiredExpression: event.target.value.trim() ? event.target.value : null } })} /></Label>
                        {(["AI_RUBRIC", "HYBRID"] as string[]).includes(exercise.evaluationMode) && <Label>AI rubric version<input className={fieldClass} value={exercise.answerRubric.aiRubricVersion ?? ""} onChange={(event) => patchExercise(index, { answerRubric: { ...exercise.answerRubric, aiRubricVersion: event.target.value.trim() ? event.target.value : null } })} /></Label>}
                      </div>
                      <div className="mt-5 flex flex-wrap gap-4"><label className="flex items-center gap-2 text-sm font-semibold"><input checked={exercise.isOptional} className="accent-[var(--navy)]" onChange={(event) => patchExercise(index, { isOptional: event.target.checked })} type="checkbox" />Không bắt buộc</label><label className="flex items-center gap-2 text-sm font-semibold"><input checked={exercise.isPreview} className="accent-[var(--navy)]" onChange={(event) => patchExercise(index, { isPreview: event.target.checked })} type="checkbox" />Cho xem preview</label></div>
                    </div>
                  </details>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-28 xl:self-start">
          <section className="admin-panel p-5">
            <p className="admin-kicker text-[var(--navy-bright)]">Draft health</p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4"><span className="text-[var(--ink-soft)]">Locales</span><strong>{value.localizations.length}/2</strong></div>
              <div className="flex justify-between gap-4"><span className="text-[var(--ink-soft)]">Objectives</span><strong>{value.localizations.reduce((sum, entry) => sum + entry.learningObjectives.length, 0)}</strong></div>
              <div className="flex justify-between gap-4"><span className="text-[var(--ink-soft)]">Exercises</span><strong>{value.exercises.length}</strong></div>
              <div className="flex justify-between gap-4"><span className="text-[var(--ink-soft)]">Tier</span><strong>{value.accessTier}</strong></div>
            </div>
          </section>
          <section className="rounded-[20px] bg-[var(--navy)] p-5 text-white">
            <p className="text-sm font-extrabold">Lưu draft không phải publish</p>
            <p className="mt-2 text-xs leading-5 text-white/70">Bạn có thể lưu metadata trước. Quy tắc publish-ready sẽ được kiểm tra lại ở bước gửi review.</p>
          </section>
        </aside>
      </div>
    </form>
  );
}
