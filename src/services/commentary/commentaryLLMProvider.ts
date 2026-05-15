export type CommentaryLLMProviderName = "openai" | "mistral" | "llama" | "local";

export type CommentaryLLMGenerateInput = {
  prompt: string;
  provider?: CommentaryLLMProviderName;
  temperature?: number;
};

export type CommentaryLLMGenerateOutput = {
  text: string;
  provider: CommentaryLLMProviderName;
  model: string;
};

function selectDefaultProvider(): CommentaryLLMProviderName {
  const configured = (process.env.COMMENTARY_LLM_PROVIDER ?? "local").toLowerCase();
  if (configured === "openai" || configured === "mistral" || configured === "llama" || configured === "local") {
    return configured;
  }
  return "local";
}

export async function generateWithCommentaryLLM(input: CommentaryLLMGenerateInput): Promise<CommentaryLLMGenerateOutput> {
  const provider = input.provider ?? selectDefaultProvider();

  // Lightweight deterministic fallback provider until external providers are wired.
  const text = input.prompt
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);

  return {
    text,
    provider,
    model: provider === "local" ? "local-template-rag-v1" : `${provider}-adapter-v1`,
  };
}
