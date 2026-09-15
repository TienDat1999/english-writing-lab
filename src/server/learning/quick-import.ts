import {
  importQuickLearningItemsSchema,
  type UploadedQuizType,
} from "./learning.contract";

const expectedHeaders = ["topic", "prompt", "answer", "context"] as const;

function parseCsvRows(value: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];

    if (character === '"') {
      if (quoted && value[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && value[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error("CSV_UNCLOSED_QUOTE");
  row.push(field);
  if (row.some((cell) => cell.trim())) rows.push(row);
  return rows;
}

export function parseQuickQuizCsv(value: string, quizType: UploadedQuizType) {
  const rows = parseCsvRows(value.replace(/^\uFEFF/u, ""));
  const headers = rows[0]?.map((header) => header.trim().toLocaleLowerCase("en"));

  if (
    !headers
    || headers.length !== expectedHeaders.length
    || expectedHeaders.some((header, index) => headers[index] !== header)
  ) {
    throw new Error("CSV_INVALID_HEADERS");
  }

  return importQuickLearningItemsSchema.parse({
    quizType,
    items: rows.slice(1).map((cells) => ({
      topic: cells[0] ?? "",
      prompt: cells[1] ?? "",
      answer: cells[2] ?? "",
      context: cells[3] ?? "",
    })),
  });
}
