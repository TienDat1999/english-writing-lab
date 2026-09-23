"use client";

import type { ContentLocale, CreateLessonDraftInput, ExerciseDraftInput } from "@draftwise/content";
import { useState } from "react";

const lessonTypeLabels: Record<string, Record<ContentLocale, string>> = {
  PARAPHRASE: { en: "Paraphrase", vi: "Paraphrase" },
  SYNONYM: { en: "Synonyms", vi: "Từ đồng nghĩa" },
  COLLOCATION: { en: "Collocations", vi: "Collocation" },
  PHRASE: { en: "Phrases", vi: "Cụm từ" },
  ACADEMIC_VOCABULARY: { en: "Academic vocabulary", vi: "Từ vựng học thuật" },
  TOPIC_VOCABULARY: { en: "Topic vocabulary", vi: "Từ vựng theo chủ đề" },
  GRAMMAR_PATTERN: { en: "Grammar patterns", vi: "Mẫu ngữ pháp" },
  SENTENCE_PATTERN: { en: "Sentence patterns", vi: "Mẫu câu" },
  ESSAY_STRUCTURE: { en: "Essay structure", vi: "Cấu trúc bài viết" },
  IDEA_DEVELOPMENT: { en: "Idea development", vi: "Phát triển ý" },
  COHESION: { en: "Cohesion", vi: "Liên kết ý" },
  TASK_STRATEGY: { en: "Task strategy", vi: "Chiến lược làm bài" },
  ERROR_CORRECTION: { en: "Error correction", vi: "Sửa lỗi" },
};

function localized<T extends { locale: ContentLocale }>(values: T[], locale: ContentLocale) {
  return values.find((entry) => entry.locale === locale)
    ?? values.find((entry) => entry.locale === "en")
    ?? values[0];
}

function exerciseInput(exercise: ExerciseDraftInput, locale: ContentLocale) {
  const copy = locale === "vi"
    ? { answer: "Nhập câu trả lời của bạn", choose: "Chọn một đáp án", write: "Viết câu trả lời hoàn chỉnh" }
    : { answer: "Type your answer", choose: "Choose one answer", write: "Write a complete answer" };

  if (["MEANING_CHOICE", "LISTEN_AND_CHOOSE"].includes(exercise.exerciseType)) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {exercise.choices.map((choice, index) => (
          <button className="min-h-12 rounded-2xl border border-[#d9d4c9] bg-white px-4 py-3 text-left text-sm font-bold text-[#17315e] transition hover:border-[#1959c7] hover:bg-[#f2f6ff]" key={`${choice}-${index}`} type="button">
            <span className="mr-2 text-[#72809a]">{String.fromCharCode(65 + index)}.</span>{choice}
          </button>
        ))}
      </div>
    );
  }

  if (exercise.exerciseType === "ORDER_PARTS") {
    return (
      <div className="flex min-h-28 flex-wrap content-start gap-2 rounded-2xl border border-dashed border-[#bcc7da] bg-[#f8faff] p-4">
        {exercise.choices.map((choice, index) => <span className="rounded-xl border border-[#d5ddea] bg-white px-3 py-2 text-sm font-bold text-[#17315e] shadow-sm" key={`${choice}-${index}`}>{choice}</span>)}
      </div>
    );
  }

  if (exercise.exerciseType === "READ_EXPLANATION") {
    const entry = localized(exercise.localizations, locale);
    return <div className="rounded-2xl bg-[#eef4ff] p-5 text-sm leading-7 text-[#42516c]">{entry?.explanationText || exercise.targetContent || exercise.contextText}</div>;
  }

  if (["BUILD_SENTENCE", "REWRITE_SENTENCE", "CORRECT_ERROR", "LISTEN_AND_SUMMARIZE"].includes(exercise.exerciseType)) {
    return <textarea className="min-h-32 w-full resize-none rounded-2xl border border-[#d9d4c9] bg-white p-4 text-sm outline-none focus:border-[#1959c7]" placeholder={copy.write} />;
  }

  return <input className="h-13 w-full rounded-2xl border border-[#d9d4c9] bg-white px-4 text-sm outline-none focus:border-[#1959c7]" placeholder={exercise.exerciseType.includes("CHOOSE") ? copy.choose : copy.answer} />;
}

export function LessonExperiencePreview({
  locale,
  value,
  versionLabel,
}: {
  locale: ContentLocale;
  value: CreateLessonDraftInput;
  versionLabel?: string;
}) {
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const safeExerciseIndex = Math.min(exerciseIndex, Math.max(value.exercises.length - 1, 0));
  const lesson = localized(value.localizations, locale);
  const exercise = value.exercises[safeExerciseIndex];
  const exerciseCopy = exercise ? localized(exercise.localizations, locale) : undefined;
  const copy = locale === "vi"
    ? { back: "Câu trước", empty: "Bài học chưa có exercise để xem trước.", next: "Câu tiếp theo", objectives: "Bạn sẽ học", preview: "Bản xem trước", start: "Nội dung bài học" }
    : { back: "Previous", empty: "This lesson has no exercises to preview yet.", next: "Next", objectives: "You will learn", preview: "Preview", start: "Lesson content" };

  return (
    <div className="min-h-[42rem] overflow-hidden rounded-[28px] bg-[#f3f0e8] text-[#13284a] shadow-[0_30px_80px_rgba(13,31,64,.18)]">
      <header className="border-b border-[#dcd7cb] bg-[#fffdf8] px-5 py-4 sm:px-7">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#ffcc3e] to-[#ff9f2f] font-black text-[#15326c]">D</span>
            <div><p className="text-sm font-black tracking-[-0.03em]">Draftwise</p><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#71809a]">{copy.preview}</p></div>
          </div>
          {versionLabel && <span className="rounded-full bg-[#e8eef8] px-3 py-1.5 text-[11px] font-extrabold text-[#173b82]">{versionLabel}</span>}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-7 sm:px-8 sm:py-10">
        <div className="flex flex-wrap gap-2 text-[10px] font-extrabold uppercase tracking-[0.1em]">
          <span className="rounded-full bg-[#173b82] px-3 py-1.5 text-white">{lessonTypeLabels[value.lessonType]?.[locale] ?? value.lessonType.replaceAll("_", " ")}</span>
          <span className="rounded-full bg-[#fff1c8] px-3 py-1.5 text-[#6e4d00]">{value.cefrLevelMin}–{value.cefrLevelMax}</span>
          <span className="rounded-full bg-[#dff2e7] px-3 py-1.5 text-[#236143]">{value.estimatedMinutes} min</span>
        </div>

        <h1 className="mt-5 text-3xl font-black leading-tight tracking-[-0.045em] sm:text-4xl">{lesson?.title || (locale === "vi" ? "Bài học chưa có tiêu đề" : "Untitled lesson")}</h1>
        {lesson?.shortDescription && <p className="mt-4 max-w-2xl text-sm leading-7 text-[#60708c]">{lesson.shortDescription}</p>}

        {lesson?.learningObjectives.length ? (
          <section className="mt-6 rounded-2xl border border-[#ded8ca] bg-[#fffdf8] p-5">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#1959c7]">{copy.objectives}</p>
            <ul className="mt-3 grid gap-2 text-sm font-semibold text-[#42516c]">
              {lesson.learningObjectives.map((objective) => <li className="flex gap-2" key={objective}><span className="text-[#2ba875]">✓</span>{objective}</li>)}
            </ul>
          </section>
        ) : null}

        <section className="mt-7 overflow-hidden rounded-[24px] border border-[#ded8ca] bg-[#fffdf8] shadow-[0_16px_45px_rgba(31,47,76,.08)]">
          <div className="flex items-center justify-between gap-4 border-b border-[#e4dfd5] bg-[#f9f7f1] px-5 py-4">
            <div><p className="text-[10px] font-black uppercase tracking-[0.13em] text-[#1959c7]">{copy.start}</p>{exercise && <p className="mt-1 text-xs font-bold text-[#71809a]">{safeExerciseIndex + 1} / {value.exercises.length} · {exercise.exerciseType.replaceAll("_", " ")}</p>}</div>
            {exercise && <div className="h-2 w-24 overflow-hidden rounded-full bg-[#dce2ec]"><div className="h-full rounded-full bg-[#f5b82e]" style={{ width: `${((safeExerciseIndex + 1) / value.exercises.length) * 100}%` }} /></div>}
          </div>

          {exercise ? (
            <div className="p-5 sm:p-7">
              {exerciseCopy?.instruction && <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#60708c]">{exerciseCopy.instruction}</p>}
              <h2 className="mt-2 text-xl font-black leading-8 tracking-[-0.025em]">{exerciseCopy?.promptText}</h2>
              {exercise.contextText && <p className="mt-4 rounded-2xl border-l-4 border-[#f5b82e] bg-[#fff8df] p-4 text-sm leading-6 text-[#5f5437]">{exercise.contextText}</p>}
              <div className="mt-6">{exerciseInput(exercise, locale)}</div>
              {exerciseCopy?.hintText && <p className="mt-4 text-xs font-semibold leading-5 text-[#60708c]">💡 {exerciseCopy.hintText}</p>}
              <div className="mt-7 flex items-center justify-between gap-3 border-t border-[#e4dfd5] pt-5">
                <button className="h-11 rounded-xl border border-[#d9d4c9] bg-white px-4 text-sm font-extrabold disabled:opacity-35" disabled={safeExerciseIndex === 0} onClick={() => setExerciseIndex(Math.max(safeExerciseIndex - 1, 0))} type="button">← {copy.back}</button>
                <button className="h-11 rounded-xl bg-[#102e72] px-5 text-sm font-extrabold text-white disabled:opacity-35" disabled={safeExerciseIndex === value.exercises.length - 1} onClick={() => setExerciseIndex(Math.min(safeExerciseIndex + 1, value.exercises.length - 1))} type="button">{copy.next} →</button>
              </div>
            </div>
          ) : <div className="px-6 py-16 text-center text-sm font-semibold text-[#60708c]">{copy.empty}</div>}
        </section>
      </main>
    </div>
  );
}
