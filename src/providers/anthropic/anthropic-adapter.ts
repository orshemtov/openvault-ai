import type { ProviderAdapter } from "../provider-adapter";
import { getJson, postJson, postStream } from "../provider-http";
import type {
  ProviderCapabilityMetadata,
  ProviderSettingsSubset,
  ProviderTextGenerationRequest,
  ProviderTextStreamCallbacks,
  ProviderTextStreamOptions,
  ProviderTextGenerationResponse
} from "../provider-runtime";

interface AnthropicModelsEnvelope {
  data: AnthropicModelResponse[];
}

interface AnthropicModelResponse {
  id: string;
  display_name?: string;
}

interface AnthropicMessagesEnvelope {
  content?: Array<{
    type: string;
    text?: string;
  }>;
}

interface AnthropicStreamEvent {
  type?: string;
  delta?: {
    text?: string;
  };
}

export class AnthropicAdapter implements ProviderAdapter {
  readonly id = "anthropic" as const;

  async listModels(
    settings: ProviderSettingsSubset
  ): Promise<ProviderCapabilityMetadata[]> {
    if (!settings.anthropicApiKey.trim()) {
      throw new Error("Anthropic API key is not configured.");
    }

    const baseUrl = settings.anthropicBaseUrl.replace(/\/$/, "");
    const response = await getJson<AnthropicModelsEnvelope>(
      `${baseUrl}/v1/models`,
      {
        "x-api-key": settings.anthropicApiKey,
        "anthropic-version": "2023-06-01"
      }
    );

    return response.data.map(normalizeAnthropicModel);
  }

  async generateText(
    request: ProviderTextGenerationRequest,
    settings: ProviderSettingsSubset
  ): Promise<ProviderTextGenerationResponse> {
    if (!settings.anthropicApiKey.trim()) {
      throw new Error("Anthropic API key is not configured.");
    }

    const baseUrl = settings.anthropicBaseUrl.replace(/\/$/, "");
    const response = await postJson<AnthropicMessagesEnvelope>(
      `${baseUrl}/v1/messages`,
      {
        model: request.modelId,
        max_tokens: 1024,
        system: request.systemPrompt,
        messages: [{ role: "user", content: request.userPrompt }],
        temperature: request.temperature
      },
      {
        "x-api-key": settings.anthropicApiKey,
        "anthropic-version": "2023-06-01"
      }
    );

    const text = response.content
      ?.filter((block) => block.type === "text")
      .map((block) => block.text?.trim() ?? "")
      .filter(Boolean)
      .join("\n\n")
      .trim();

    if (!text) {
      throw new Error("Anthropic returned an empty response.");
    }

    return { text };
  }

  async streamText(
    request: ProviderTextGenerationRequest,
    settings: ProviderSettingsSubset,
    callbacks: ProviderTextStreamCallbacks,
    options?: ProviderTextStreamOptions
  ): Promise<ProviderTextGenerationResponse> {
    if (!settings.anthropicApiKey.trim()) {
      throw new Error("Anthropic API key is not configured.");
    }

    const baseUrl = settings.anthropicBaseUrl.replace(/\/$/, "");
    let text = "";
    let buffer = "";

    await postStream(
      `${baseUrl}/v1/messages`,
      {
        model: request.modelId,
        max_tokens: 1024,
        stream: true,
        system: request.systemPrompt,
        messages: [{ role: "user", content: request.userPrompt }],
        temperature: request.temperature
      },
      {
        "x-api-key": settings.anthropicApiKey,
        "anthropic-version": "2023-06-01"
      },
      (chunk) => {
        buffer += chunk;
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          for (const line of event.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) {
              continue;
            }

            const payload = trimmed.slice(5).trim();
            if (!payload) {
              continue;
            }

            const parsed = JSON.parse(payload) as AnthropicStreamEvent;
            const delta =
              parsed.type === "content_block_delta"
                ? (parsed.delta?.text ?? "")
                : "";
            if (!delta) {
              continue;
            }

            text += delta;
            callbacks.onDelta(delta);
          }
        }
      },
      options?.signal
    );

    if (!text.trim()) {
      throw new Error("Anthropic returned an empty response.");
    }

    return { text: text.trim() };
  }
}

function normalizeAnthropicModel(
  model: AnthropicModelResponse
): ProviderCapabilityMetadata {
  return {
    providerId: "anthropic",
    modelId: model.id,
    displayName: model.display_name?.trim() || model.id,
    isLocal: false,
    supportsGeneration: true,
    supportsEmbeddings: false,
    supportsStreaming: true,
    supportsToolCalling: false,
    supportsStructuredOutput: false,
    contextWindow: null,
    recommendedUses: ["chat"]
  };
}
