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

interface OpenAiModelsEnvelope {
  data: OpenAiModelResponse[];
}

interface OpenAiModelResponse {
  id: string;
}

interface OpenAiChatCompletionEnvelope {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

interface OpenAiStreamChunk {
  choices?: Array<{
    delta?: {
      content?: string;
    };
  }>;
}

export class OpenAiAdapter implements ProviderAdapter {
  readonly id = "openai" as const;

  async listModels(
    settings: ProviderSettingsSubset
  ): Promise<ProviderCapabilityMetadata[]> {
    if (!settings.openAiApiKey.trim()) {
      throw new Error("OpenAI API key is not configured.");
    }

    const baseUrl = settings.openAiBaseUrl.replace(/\/$/, "");
    const response = await getJson<OpenAiModelsEnvelope>(`${baseUrl}/models`, {
      Authorization: `Bearer ${settings.openAiApiKey}`
    });

    return response.data
      .filter((model) => isUsefulOpenAiModel(model.id))
      .map(normalizeOpenAiModel);
  }

  async generateText(
    request: ProviderTextGenerationRequest,
    settings: ProviderSettingsSubset
  ): Promise<ProviderTextGenerationResponse> {
    if (!settings.openAiApiKey.trim()) {
      throw new Error("OpenAI API key is not configured.");
    }

    const baseUrl = settings.openAiBaseUrl.replace(/\/$/, "");
    const response = await postJson<OpenAiChatCompletionEnvelope>(
      `${baseUrl}/chat/completions`,
      {
        model: request.modelId,
        messages: [
          { role: "system", content: request.systemPrompt },
          { role: "user", content: request.userPrompt }
        ],
        temperature: request.temperature
      },
      {
        Authorization: `Bearer ${settings.openAiApiKey}`
      }
    );

    const text = response.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new Error("OpenAI returned an empty response.");
    }

    return { text };
  }

  async streamText(
    request: ProviderTextGenerationRequest,
    settings: ProviderSettingsSubset,
    callbacks: ProviderTextStreamCallbacks,
    options?: ProviderTextStreamOptions
  ): Promise<ProviderTextGenerationResponse> {
    if (!settings.openAiApiKey.trim()) {
      throw new Error("OpenAI API key is not configured.");
    }

    const baseUrl = settings.openAiBaseUrl.replace(/\/$/, "");
    let text = "";
    let buffer = "";

    await postStream(
      `${baseUrl}/chat/completions`,
      {
        model: request.modelId,
        stream: true,
        messages: [
          { role: "system", content: request.systemPrompt },
          { role: "user", content: request.userPrompt }
        ],
        temperature: request.temperature
      },
      {
        Authorization: `Bearer ${settings.openAiApiKey}`
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
            if (!payload || payload === "[DONE]") {
              continue;
            }

            const parsed = JSON.parse(payload) as OpenAiStreamChunk;
            const delta = parsed.choices?.[0]?.delta?.content ?? "";
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
      throw new Error("OpenAI returned an empty response.");
    }

    return { text: text.trim() };
  }
}

function normalizeOpenAiModel(
  model: OpenAiModelResponse
): ProviderCapabilityMetadata {
  return {
    providerId: "openai",
    modelId: model.id,
    displayName: model.id,
    isLocal: false,
    supportsGeneration: true,
    supportsEmbeddings: model.id.includes("embed"),
    supportsStreaming: true,
    supportsToolCalling: false,
    supportsStructuredOutput: false,
    contextWindow: null,
    recommendedUses: ["chat"]
  };
}

function isUsefulOpenAiModel(modelId: string): boolean {
  const lowerModelId = modelId.toLowerCase();

  if (lowerModelId.includes("embed") || lowerModelId.includes("audio")) {
    return false;
  }

  return (
    lowerModelId.startsWith("gpt") ||
    lowerModelId.startsWith("o1") ||
    lowerModelId.startsWith("o3") ||
    lowerModelId.startsWith("o4")
  );
}
