type OpenAiContentItem = { type?: string; text?: string; refusal?: string }
type OpenAiOutputItem = { type?: string; content?: OpenAiContentItem[] }
export type OpenAiResponse = {
  model?: string
  output?: OpenAiOutputItem[]
  error?: { message?: string }
}

export function readOutputText(response: OpenAiResponse): string {
  for (const output of response.output ?? []) {
    for (const content of output.content ?? []) {
      if (content.type === "refusal") {
        throw new Error(`OpenAI refused: ${content.refusal ?? "Unknown reason"}`)
      }
      if (content.type === "output_text" && content.text) {
        return content.text
      }
    }
  }
  throw new Error("OpenAI returned no structured output text")
}
