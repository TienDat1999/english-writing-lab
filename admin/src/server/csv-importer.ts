import "server-only";

import { type CreateLessonDraftInput } from "@draftwise/content";
import { ObjectId } from "mongodb";

import { getDatabaseEnv } from "./env";
import { createAdminLessonDraft } from "./lesson-editor";
import { getMongoClient } from "./mongodb";
import { createCategory, createTopic } from "./taxonomy";

export type ContentKind =
  | "TOPIC_VOCABULARY"
  | "SYNONYM"
  | "COLLOCATION"
  | "PARAPHRASE"
  | "TEMPLATE";

export type CSVPreviewResult = {
  kind: ContentKind;
  rowCount: number;
  topicsFound: string[];
  headers: string[];
  sampleRows: Record<string, string>[];
  estimatedLessons: number;
};

export type CSVImportResult = {
  lessonsCreated: number;
  exercisesCreated: number;
  topicsCreated: number;
  lessonIds: string[];
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item-" + Math.random().toString(36).substring(2, 7);
}

function codeify(text: string) {
  return text
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Đ/g, "D")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "CODE_" + Math.random().toString(36).substring(2, 7);
}

export function parseCSV(rawText: string): { headers: string[]; rows: Record<string, string>[] } {
  // Strip UTF-8 BOM if present
  const text = rawText.charCodeAt(0) === 0xfeff ? rawText.slice(1) : rawText;
  const lines: string[] = [];
  let currentLine = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentLine += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if ((char === "\r" || char === "\n") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") i++;
      if (currentLine.trim()) lines.push(currentLine);
      currentLine = "";
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) lines.push(currentLine);

  if (lines.length === 0) return { headers: [], rows: [] };

  function splitLine(line: string): string[] {
    const fields: string[] = [];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const next = line[i + 1];

      if (char === '"') {
        if (inQuotes && next === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        fields.push(field.trim());
        field = "";
      } else {
        field += char;
      }
    }
    fields.push(field.trim());
    return fields;
  }

  const headers = splitLine(lines[0]).map((h) => h.toLowerCase());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitLine(lines[i]);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] ?? "";
    }
    if (Object.values(row).some((val) => val.trim())) {
      rows.push(row);
    }
  }

  return { headers, rows };
}

export function detectContentKind(headers: string[]): ContentKind {
  const hSet = new Set(headers.map((h) => h.toLowerCase()));
  if (hSet.has("template_text") || hSet.has("linking_words") || hSet.has("sample_filled")) {
    return "TEMPLATE";
  }
  if (hSet.has("original_phrase") || hSet.has("paraphrased_phrase")) {
    return "PARAPHRASE";
  }
  if (hSet.has("missing_part") && hSet.has("collocation")) {
    return "COLLOCATION";
  }
  if (hSet.has("synonym")) {
    return "SYNONYM";
  }
  return "TOPIC_VOCABULARY";
}

export async function previewCSVData(rawText: string, specifiedKind?: ContentKind): Promise<CSVPreviewResult> {
  const { headers, rows } = parseCSV(rawText);
  const kind = specifiedKind ?? detectContentKind(headers);
  const topicsSet = new Set<string>();

  for (const row of rows) {
    const topic = row.topic || "Chung";
    topicsSet.add(topic);
  }

  return {
    kind,
    rowCount: rows.length,
    topicsFound: Array.from(topicsSet),
    headers,
    sampleRows: rows.slice(0, 5),
    estimatedLessons: topicsSet.size,
  };
}

async function findOrCreateTopicForCSV(
  actorUserId: string,
  topicName: string,
  kind: ContentKind,
): Promise<{ topicId: string; newlyCreated: boolean }> {
  const database = getMongoClient().db(getDatabaseEnv().databaseName);
  const code = codeify(topicName);

  // Check if topic exists
  const existingTopic = await database.collection("content_topics").findOne({
    $or: [
      { code },
      { "localizations.name": topicName },
    ],
    status: "ACTIVE",
  });

  if (existingTopic) {
    return { topicId: existingTopic._id.toString(), newlyCreated: false };
  }

  // Find or create category
  const isWriting = kind === "TEMPLATE";
  const catCode = isWriting ? "WRITING_SKILLS" : "VOCABULARY_SKILLS";
  const catName = isWriting ? "Writing Skills" : "Vocabulary Skills";

  let category = await database.collection("content_categories").findOne({
    code: catCode,
    status: "ACTIVE",
  });

  if (!category) {
    const createdCat = await createCategory(actorUserId, {
      code: catCode,
      sortOrder: 0,
      localizations: [
        { locale: "vi", name: catName, slug: slugify(catName), description: "Danh mục tạo tự động từ import" },
        { locale: "en", name: catName, slug: slugify(catName) + "-en", description: "Auto-created from import" },
      ],
    });
    category = { _id: new ObjectId(createdCat.id) } as any;
  }

  // Create Topic
  const topSlug = slugify(topicName);
  const newTopic = await createTopic(actorUserId, {
    categoryId: category!._id.toString(),
    code,
    sortOrder: 0,
    aliases: [topicName],
    localizations: [
      { locale: "vi", name: topicName, slug: topSlug, description: `Chủ đề ${topicName}` },
      { locale: "en", name: topicName, slug: topSlug + "-en", description: `Topic ${topicName}` },
    ],
  });

  return { topicId: newTopic.id, newlyCreated: true };
}

export async function importCSVData(
  actorUserId: string,
  rawText: string,
  specifiedKind?: ContentKind,
  packageTitle?: string,
): Promise<CSVImportResult & { packageId?: string }> {
  const { headers, rows } = parseCSV(rawText);
  if (rows.length === 0) {
    throw new Error("File CSV không có dữ liệu để import.");
  }

  const kind = specifiedKind ?? detectContentKind(headers);

  // Group rows by topic
  const grouped = new Map<string, Record<string, string>[]>();
  for (const row of rows) {
    const topic = (row.topic || "General").trim();
    if (!grouped.has(topic)) grouped.set(topic, []);
    grouped.get(topic)!.push(row);
  }

  let lessonsCreated = 0;
  let exercisesCreated = 0;
  let topicsCreated = 0;
  const lessonIds: string[] = [];
  const database = getMongoClient().db(getDatabaseEnv().databaseName);

  for (const [topicName, topicRows] of grouped.entries()) {
    const { topicId, newlyCreated } = await findOrCreateTopicForCSV(actorUserId, topicName, kind);
    if (newlyCreated) topicsCreated++;

    const isWriting = kind === "TEMPLATE";
    const primarySkill = isWriting ? "WRITING" : "VOCABULARY";
    const lessonType =
      kind === "TEMPLATE"
        ? "SENTENCE_PATTERN"
        : kind === "PARAPHRASE"
          ? "PARAPHRASE"
          : kind === "SYNONYM"
            ? "SYNONYM"
            : kind === "COLLOCATION"
              ? "COLLOCATION"
              : "TOPIC_VOCABULARY";

    // Chặn trùng lặp nếu bài học cho topic này đã tồn tại
    const existingVersion = await database.collection("lesson_versions").findOne({
      primaryTopicId: new ObjectId(topicId),
      lessonType,
      status: { $in: ["DRAFT", "IN_REVIEW", "APPROVED", "PUBLISHED"] },
    });

    if (existingVersion) {
      lessonIds.push(existingVersion.lessonId.toString());
      continue;
    }

    const lessonTitleVi = `${topicName} - ${
      kind === "TOPIC_VOCABULARY"
        ? "Từ vựng chuyên đề"
        : kind === "SYNONYM"
          ? "Từ đồng nghĩa nâng cao"
          : kind === "COLLOCATION"
            ? "Collocations tự nhiên"
            : kind === "PARAPHRASE"
              ? "Kỹ thuật Paraphrase"
              : "Mẫu câu & Templates"
    }`;
    const lessonTitleEn = `${topicName} - ${kind.replace("_", " ")}`;
    const baseSlug = `${slugify(topicName)}-${slugify(kind)}`;

    const exercises: CreateLessonDraftInput["exercises"] = topicRows.map((row, idx) => {
      const pos = idx + 1;

      if (kind === "TOPIC_VOCABULARY") {
        const word = (row.word || "").trim();
        const distractors = (row.distractors || "")
          .split(";")
          .map((s) => s.trim())
          .filter(Boolean);
        const choices = [word, ...distractors].sort(() => Math.random() - 0.5);
        const context = (row.example_sentence || "").replace(new RegExp(`\\b${word}\\b`, "gi"), "[...]");

        return {
          position: pos,
          exerciseType: "MEANING_CHOICE",
          evaluationMode: "NORMALIZED",
          localizations: [
            {
              locale: "vi",
              instruction: "Chọn từ vựng đúng để hoàn thiện câu sau:",
              promptText: `Nghĩa: ${row.meaning_vi || word} ${row.ipa ? `[${row.ipa}]` : ""}`,
              hintText: row.collocations ? `Collocation: ${row.collocations}` : "",
              explanationText: row.definition_en || "",
            },
            {
              locale: "en",
              instruction: "Choose the correct vocabulary word to complete the sentence:",
              promptText: row.definition_en || word,
              hintText: row.ipa || "",
              explanationText: row.definition_en || "",
            },
          ],
          targetContent: word,
          contextText: context || row.example_sentence || "",
          choices,
          answerRubric: {
            correctAnswer: word,
            acceptedAnswers: [word],
            requiredExpression: null,
            grammarWeight: null,
            meaningWeight: null,
            minimumScore: null,
            aiRubricVersion: null,
            rules: null,
          },
          mediaAssetIds: [],
          estimatedSeconds: 45,
          isOptional: false,
          isPreview: idx === 0,
        };
      }

      if (kind === "SYNONYM") {
        const word = (row.word || "").trim();
        const synonym = (row.synonym || "").trim();
        const accepted = (row.accepted_synonyms || "")
          .split(";")
          .map((s) => s.trim())
          .filter(Boolean);
        const acceptedAnswers = [synonym, ...accepted];

        return {
          position: pos,
          exerciseType: "TYPE_ANSWER",
          evaluationMode: "NORMALIZED",
          localizations: [
            {
              locale: "vi",
              instruction: `Tìm từ đồng nghĩa nâng cao cho "${word}":`,
              promptText: row.explanation || `Từ cần thay thế: ${word}`,
              hintText: accepted[0] ? `Gợi ý ký tự đầu: ${synonym.charAt(0)}...` : "",
              explanationText: row.explanation || "",
            },
            {
              locale: "en",
              instruction: `Find the academic synonym for "${word}":`,
              promptText: `Target word: ${word}`,
              hintText: "",
              explanationText: "",
            },
          ],
          targetContent: word,
          contextText: row.context || "",
          choices: [],
          answerRubric: {
            correctAnswer: synonym,
            acceptedAnswers,
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
          isPreview: idx === 0,
        };
      }

      if (kind === "COLLOCATION") {
        const missing = (row.missing_part || "").trim();
        const distractors = (row.distractors || "")
          .split(";")
          .map((s) => s.trim())
          .filter(Boolean);
        const choices = [missing, ...distractors].sort(() => Math.random() - 0.5);

        // Lưu ý quan trọng cho COLLOCATION:
        // - targetContent: Cụm đầy đủ tiếng Anh (VD: "make a decision") -> Dùng cho 3-step Review, Audio TTS & gợi nhớ.
        // - answerRubric.correctAnswer: Từ khuyết (VD: "make") -> Dùng cho preview quiz điền từ.
        // - promptText: Nghĩa tiếng Việt thuần túy (VD: "đưa ra quyết định") -> KHÔNG gắn tiền tố "Ý nghĩa: ".
        const cleanMeaningVi = (row.meaning_vi || row.collocation).trim();

        return {
          position: pos,
          exerciseType: "MEANING_CHOICE",
          evaluationMode: "NORMALIZED",
          localizations: [
            {
              locale: "vi",
              instruction: "Chọn từ còn thiếu để tạo thành cụm Collocation tự nhiên:",
              promptText: cleanMeaningVi,
              hintText: row.collocation || "",
              explanationText: row.collocation || "",
            },
            {
              locale: "en",
              instruction: "Select the missing word to complete the natural collocation:",
              promptText: row.collocation || "",
              hintText: "",
              explanationText: "",
            },
          ],
          targetContent: row.collocation || missing,
          contextText: row.context || "",
          choices,
          answerRubric: {
            correctAnswer: missing,
            acceptedAnswers: [missing],
            requiredExpression: null,
            grammarWeight: null,
            meaningWeight: null,
            minimumScore: null,
            aiRubricVersion: null,
            rules: null,
          },
          mediaAssetIds: [],
          estimatedSeconds: 45,
          isOptional: false,
          isPreview: idx === 0,
        };
      }

      if (kind === "PARAPHRASE") {
        const orig = (row.original_phrase || "").trim();
        const para = (row.paraphrased_phrase || "").trim();
        const accepted = (row.accepted_alternatives || "")
          .split(";")
          .map((s) => s.trim())
          .filter(Boolean);
        const acceptedAnswers = [para, ...accepted];

        return {
          position: pos,
          exerciseType: "TYPE_ANSWER",
          evaluationMode: "NORMALIZED",
          localizations: [
            {
              locale: "vi",
              instruction: `Diễn đạt lại cụm từ "${orig}" bằng cách diễn đạt tương đương:`,
              promptText: row.vietnamese_hint ? `Gợi ý nghĩa: ${row.vietnamese_hint}` : orig,
              hintText: row.vietnamese_hint || "",
              explanationText: para,
            },
            {
              locale: "en",
              instruction: `Paraphrase the phrase "${orig}":`,
              promptText: orig,
              hintText: "",
              explanationText: para,
            },
          ],
          targetContent: orig,
          contextText: row.context || "",
          choices: [],
          answerRubric: {
            correctAnswer: para,
            acceptedAnswers,
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
          isPreview: idx === 0,
        };
      }

      // TEMPLATE
      const comp = (row.component || "Sentence").trim();
      const tmpl = (row.template_text || "").trim();
      const sample = (row.sample_filled || "").trim();
      const linking = (row.linking_words || "").trim();

      return {
        position: pos,
        exerciseType: "TYPE_ANSWER",
        evaluationMode: "NORMALIZED",
        localizations: [
          {
            locale: "vi",
            instruction: `Hoàn thiện mẫu cấu trúc phần [${comp}]:`,
            promptText: tmpl,
            hintText: linking ? `Từ nối trọng tâm: ${linking}` : "",
            explanationText: sample,
          },
          {
            locale: "en",
            instruction: `Complete the structure template for [${comp}]:`,
            promptText: tmpl,
            hintText: linking,
            explanationText: sample,
          },
        ],
        targetContent: tmpl,
        contextText: sample,
        choices: [],
        answerRubric: {
          correctAnswer: tmpl,
          acceptedAnswers: [tmpl],
          requiredExpression: null,
          grammarWeight: null,
          meaningWeight: null,
          minimumScore: null,
          aiRubricVersion: null,
          rules: null,
        },
        mediaAssetIds: [],
        estimatedSeconds: 90,
        isOptional: false,
        isPreview: idx === 0,
      };
    });

    const lessonPayload: CreateLessonDraftInput = {
      defaultLocale: "en",
      slugs: [
        { locale: "vi", slug: `${baseSlug}-${Math.random().toString(36).substring(2, 6)}` },
        { locale: "en", slug: `${baseSlug}-en-${Math.random().toString(36).substring(2, 6)}` },
      ],
      primarySkill,
      lessonType,
      learningLanguage: "en",
      localizations: [
        {
          locale: "vi",
          title: lessonTitleVi,
          shortDescription: `Bài học ${lessonTitleVi} gồm ${exercises.length} câu hỏi thực hành tương tác.`,
          learningObjectives: [
            `Nắm vững các dạng ${kind.toLowerCase()} trong chủ đề ${topicName}.`,
            "Vận dụng chính xác vào bài thi VSTEP / IELTS.",
          ],
          contentBlocks: [],
        },
        {
          locale: "en",
          title: lessonTitleEn,
          shortDescription: `Lesson on ${topicName} with ${exercises.length} interactive exercises.`,
          learningObjectives: [
            `Master ${kind.toLowerCase()} concepts in ${topicName}.`,
            "Apply accurately in exam scenarios.",
          ],
          contentBlocks: [],
        },
      ],
      cefrLevelMin: "B1",
      cefrLevelMax: "B2",
      audiences: ["GENERAL_ENGLISH"],
      ieltsMetadata: null,
      primaryTopicId: topicId,
      secondaryTopicIds: [],
      tagCodes: [kind.toLowerCase()],
      estimatedMinutes: Math.max(5, exercises.length * 2),
      visibility: "PUBLIC",
      accessTier: "FREE",
      coverAssetId: null,
      prerequisiteLessonIds: [],
      relatedLessonIds: [],
      exercises,
    };

    const draft = await createAdminLessonDraft(actorUserId, lessonPayload);
    lessonsCreated++;
    exercisesCreated += exercises.length;
    lessonIds.push(draft.lessonId);
  }

  let packageId: string | undefined;
  if (lessonIds.length > 0) {
    const actorObjectId = ObjectId.isValid(actorUserId) ? new ObjectId(actorUserId) : new ObjectId();
    const now = new Date();
    const defaultTitle = packageTitle?.trim() || `Bộ ${kind.replace("_", " ")} (${new Date().toLocaleDateString("vi-VN")})`;
    const slug = slugify(defaultTitle) + "-" + Math.random().toString(36).substring(2, 6);

    const pkgDoc = {
      title: defaultTitle,
      kind,
      slugs: [{ locale: "vi", slug }],
      localizations: [
        { locale: "vi", title: defaultTitle, description: `Bộ học gồm ${grouped.size} chủ đề` },
        { locale: "en", title: defaultTitle, description: `Package of ${grouped.size} topics` },
      ],
      status: "DRAFT",
      visibility: "PUBLIC",
      accessTier: "FREE",
      topicCount: grouped.size,
      itemCount: exercisesCreated,
      items: lessonIds.map((id, idx) => ({
        lessonId: new ObjectId(id),
        position: idx + 1,
      })),
      createdBy: actorObjectId,
      lastEditedBy: actorObjectId,
      createdAt: now,
      updatedAt: now,
    };

    const pkgResult = await database.collection("content_collections").insertOne(pkgDoc);
    packageId = pkgResult.insertedId.toString();
  }

  return {
    lessonsCreated,
    exercisesCreated,
    topicsCreated,
    lessonIds,
    packageId,
  };
}
