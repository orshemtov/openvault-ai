import type { ProviderAdapter } from "@providers/provider-adapter";
import { getJson, postJson, postStream } from "@providers/provider-http";
import type {
  ProviderCapabilityMetadata,
  ProviderSettingsSubset,
  ProviderTextGenerationRequest,
  ProviderTextStreamCallbacks,
  ProviderTextStreamOptions,
  ProviderTextGenerationResponse
} from "@providers/provider-runtime";
import {
  normalizeOpenRouterModel,
  type OpenRouterModelResponse
} from "./openrouter-normalize";

interface OpenRouterModelsEnvelope {
  data: OpenRouterModelResponse[];
}

interface OpenRouterChatCompletionEnvelope {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

interface OpenRouterStreamChunk {
  choices?: Array<{
    delta?: {
      content?: string;
    };
  }>;
}

export class OpenRouterAdapter implements ProviderAdapter {
  readonly id = "openrouter" as const;

  async listModels(
    settings: ProviderSettingsSubset
  ): Promise<ProviderCapabilityMetadata[]> {
    if (!settings.openRouterApiKey.trim()) {
      throw new Error("OpenRouter API key is not configured.");
    }

    const baseUrl = settings.openRouterBaseUrl.replace(/\/$/, "");
    const response = await getJson<OpenRouterModelsEnvelope>(
      `${baseUrl}/models`,
      {
        Authorization: `Bearer ${settings.openRouterApiKey}`
      }
    );

    return response.data.map(normalizeOpenRouterModel);
  }

  async generateText(
    request: ProviderTextGenerationRequest,
    settings: ProviderSettingsSubset
  ): Promise<ProviderTextGenerationResponse> {
    if (!settings.openRouterApiKey.trim()) {
      throw new Error("OpenRouter API key is not configured.");
    }

    const baseUrl = settings.openRouterBaseUrl.replace(/\/$/, "");
    const response = await postJson<OpenRouterChatCompletionEnvelope>(
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
        Authorization: `Bearer ${settings.openRouterApiKey}`
      }
    );

    const text = response.choices?.[0]?.message?.content?.trim();
    if (!text) {
      throw new Error("OpenRouter returned an empty response.");
    }

    return { text };
  }

  async streamText(
    request: ProviderTextGenerationRequest,
    settings: ProviderSettingsSubset,
    callbacks: ProviderTextStreamCallbacks,
    options?: ProviderTextStreamOptions
  ): Promise<ProviderTextGenerationResponse> {
    if (!settings.openRouterApiKey.trim()) {
      throw new Error("OpenRouter API key is not configured.");
    }

    const baseUrl = settings.openRouterBaseUrl.replace(/\/$/, "");
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
        Authorization: `Bearer ${settings.openRouterApiKey}`
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

            const parsed = JSON.parse(payload) as OpenRouterStreamChunk;
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
      throw new Error("OpenRouter returned an empty response.");
    }

    return { text: text.trim() };
  }
}
