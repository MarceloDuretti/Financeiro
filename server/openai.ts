// OpenAI API client using fetch (lightweight alternative to SDK)
// Using GPT-4o-mini for cost-effective processing

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  response_format?: { type: "json_object" };
  max_tokens?: number;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function callOpenAI(
  messages: OpenAIMessage[],
  options: { jsonMode?: boolean; maxTokens?: number } = {}
): Promise<string> {
  const body: OpenAIRequest = {
    model: "gpt-4o-mini", // Most cost-effective model
    messages,
    ...(options.jsonMode && { response_format: { type: "json_object" } }),
    ...(options.maxTokens && { max_tokens: options.maxTokens }),
  };

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data: OpenAIResponse = await response.json();
  return data.choices[0].message.content;
}
