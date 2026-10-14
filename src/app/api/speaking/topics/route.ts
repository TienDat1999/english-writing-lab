import { TOPIC_CATALOG } from "@/server/speaking/domain/topic-catalog.data"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")
  const level = searchParams.get("level")

  let filtered = TOPIC_CATALOG

  if (category && category !== "ALL") {
    filtered = filtered.filter((t) => t.category.toLowerCase() === category.toLowerCase())
  }

  if (level && level !== "ALL") {
    filtered = filtered.filter((t) => t.level === level)
  }

  return Response.json({ topics: filtered })
}
