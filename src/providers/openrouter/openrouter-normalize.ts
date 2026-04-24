import type { ProviderCapabilityMetadata } from "@providers/provider-runtime";

export interface OpenRouterModelResponse {
  id: string;
  name?: string;
  context_length?: number;
  architecture?: {
    modality?: string;
    input_modalities?: string[];
    output_modalities?: string[];
  };
  supported_parameters?: string[];
}

const hasParameter = (
  parameters: string[] | undefined,
  name: string
): boolean => Array.isArray(parameters) && parameters.includes(name);

export function normalizeOpenRouterModel(
  model: OpenRouterModelResponse
): ProviderCapabilityMetadata {
  const supportedParameters = model.supported_parameters ?? [];

  return {
    providerId: "openrouter",
    modelId: model.id,
    displayName: model.name?.trim() || model.id,
    isLocal: false,
    supportsGeneration: true,
    supportsEmbeddings:
      model.id.includes("embed") || model.id.includes("embedding"),
    supportsStreaming: true,
    supportsToolCalling:
      hasParameter(supportedParameters, "tools") ||
      hasParameter(supportedParameters, "tool_choice"),
    supportsStructuredOutput:
      hasParameter(supportedParameters, "response_format") ||
      hasParameter(supportedParameters, "structured_outputs"),
    contextWindow: model.context_length ?? null,
    recommendedUses: inferOpenRouterRecommendedUses(model.id)
  };
}

function inferOpenRouterRecommendedUses(modelId: string): string[] {
  const uses = ["chat"];
  const lowerModelId = modelId.toLowerCase();

  if (lowerModelId.includes("embed")) {
    uses.push("embeddings");
  }

  if (lowerModelId.includes("gpt") || lowerModelId.includes("claude")) {
    uses.push("edit", "analytics");
  }

  return [...new Set(uses)];
}
