import { EXAM_MOCK_TESTS } from "@/server/speaking/domain/exam-prompts.data"

export async function GET() {
  return Response.json({ exams: EXAM_MOCK_TESTS })
}
