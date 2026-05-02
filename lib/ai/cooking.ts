import { serverEnv } from "@/lib/env";

type GenerateCookingTextInput = {
  system: string;
  prompt: string;
  maxTokens?: number;
  json?: boolean;
};

type AnthropicResponse = {
  content?: { type: "text"; text: string }[];
};

type GeminiResponse = {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
    finishReason?: string;
  }[];
};

export type AiTextResult = {
  text: string;
  source: "gemini" | "anthropic";
};

function stripMarkdown(value: string): string {
  return (
    value
      .replace(/\*\*([\s\S]+?)\*\*/g, "$1")
      .replace(/__([\s\S]+?)__/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/^>\s+/gm, "")
      .replace(/^\s*[-*+]\s+/gm, "• ")
      .replace(/^[ \t]*\d+\.\s+/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

function readGeminiText(data: GeminiResponse) {
  return data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join("\n")
    .trim();
}

function readAnthropicText(data: AnthropicResponse) {
  return data.content?.find((block) => block.type === "text")?.text?.trim();
}

function getGeminiThinkingConfig(model: string) {
  if (model.startsWith("gemini-3")) {
    return { thinkingLevel: "minimal" };
  }

  return { thinkingBudget: 0 };
}

export async function generateCookingText({
  system,
  prompt,
  maxTokens = 300,
  json = false,
}: GenerateCookingTextInput): Promise<AiTextResult | null> {
  if (serverEnv.geminiApiKey) {
    const geminiUrl = new URL(
      `https://generativelanguage.googleapis.com/v1beta/models/${serverEnv.geminiModel}:generateContent`,
    );
    geminiUrl.searchParams.set("key", serverEnv.geminiApiKey);

    try {
      const response = await fetch(geminiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: system }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            maxOutputTokens: Math.max(maxTokens, json ? 1200 : 512),
            thinkingConfig: getGeminiThinkingConfig(serverEnv.geminiModel),
            ...(json ? { responseMimeType: "application/json" } : {}),
          },
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as GeminiResponse;
        const text = readGeminiText(data);

        if (text) {
          return { text: json ? text : stripMarkdown(text), source: "gemini" };
        }
      }
    } catch {
      // Fall through to Anthropic or local fallback.
    }
  }

  if (serverEnv.anthropicApiKey) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": serverEnv.anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-latest",
          max_tokens: maxTokens,
          system,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as AnthropicResponse;
        const text = readAnthropicText(data);

        if (text) {
          return {
            text: json ? text : stripMarkdown(text),
            source: "anthropic",
          };
        }
      }
    } catch {
      // Fall through to local fallback.
    }
  }

  return null;
}
