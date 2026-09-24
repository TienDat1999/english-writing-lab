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
        throw new Error(`OpenAI refused: ${content.refusal ?? "Unknown reason"}`);
      }
      if (
        (content.type === "output_text" || content.type === "text" || !content.type) &&
        content.text
      ) {
        return content.text;
      }
    }
  }

  const chatResponse = response as unknown as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  if (chatResponse.choices?.[0]?.message?.content) {
    return chatResponse.choices[0].message.content;
  }

  throw new Error("OpenAI returned no structured output text");
}
