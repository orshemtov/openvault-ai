import type { ProviderCapabilityMetadata } from "@providers/provider-runtime";

export interface OllamaModelResponse {
  model: string;
  name?: string;
  details?: {
    family?: string;
    families?: string[];
    parameter_size?: string;
  };
}

export function normalizeOllamaModel(
  model: OllamaModelResponse
): ProviderCapabilityMetadata {
  const modelId = model.model || model.name || "unknown";
  const lowerModelId = modelId.toLowerCase();

  return {
    providerId: "ollama",
    modelId,
    displayName: model.name?.trim() || modelId,
    isLocal: true,
    supportsGeneration: true,
    supportsEmbeddings: lowerModelId.includes("embed"),
    supportsStreaming: true,
    supportsToolCalling: false,
    supportsStructuredOutput: false,
    contextWindow: null,
    recommendedUses: inferOllamaRecommendedUses(lowerModelId)
  };
}

function inferOllamaRecommendedUses(modelId: string): string[] {
  const uses = ["chat", "local"];

  if (modelId.includes("embed")) {
    uses.push("embeddings");
  }

  if (
    modelId.includes("llama") ||
    modelId.includes("qwen") ||
    modelId.includes("mistral")
  ) {
    uses.push("edit");
  }

  return [...new Set(uses)];
}
