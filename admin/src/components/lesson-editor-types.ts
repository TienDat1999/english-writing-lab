export type LessonEditorActionState = {
  issues?: string[];
  message: string;
  revision?: number;
  status: "idle" | "error" | "success";
};

export const initialLessonEditorActionState: LessonEditorActionState = {
  message: "",
  status: "idle",
};
