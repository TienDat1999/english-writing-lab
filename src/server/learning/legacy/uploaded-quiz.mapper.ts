import { Types } from "mongoose";

import type { LearningItemDocument } from "../learning-item.schema";
import type { UploadedQuizType } from "../learning.contract";
import { type LearningItemView, toView } from "../learning-item.view";

export type UploadedQuizTopicView = {
  topic: string;
  count: number;
  completedCount: number;
  completed: boolean;
  quizType: UploadedQuizType;
};

function getLegacyUploadedQuizContent(item: LearningItemDocument) {
  const paraphraseMatch = item.promptText.match(/^Paraphrase "(.+)": _____$/u);

  if (paraphraseMatch) {
    const separatorIndex = (item.hintVi ?? "").indexOf(" · ");
    const topicVi = separatorIndex >= 0 ? item.hintVi.slice(0, separatorIndex) : item.hintVi;
    const promptVi = separatorIndex >= 0 ? item.hintVi.slice(separatorIndex + 3) : item.hintVi;

    return {
      topicText: `${paraphraseMatch[1]} — ${topicVi}`,
      promptText: promptVi || topicVi,
    };
  }

  return {
    topicText: "100 cặp Synonym",
    promptText: item.hintVi || item.promptText,
  };
}

export function toUploadedQuizView(item: LearningItemDocument & { _id: Types.ObjectId }): LearningItemView {
  const view = toView(item);
  const legacyContent = item.title === "Imported Quick Quiz"
    ? getLegacyUploadedQuizContent(item)
    : null;

  return {
    ...view,
    sourceType: "UPLOADED_QUIZ",
    topicText: legacyContent?.topicText || view.topicText || "Chưa phân loại",
    quizType: view.quizType
      ?? ((legacyContent?.topicText || view.topicText) === "100 cặp Synonym" ? "SYNONYM" : "PARAPHRASE"),
    promptText: legacyContent?.promptText || view.promptText,
    hintVi: "",
  };
}
