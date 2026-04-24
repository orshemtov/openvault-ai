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
  normalizeOllamaModel,
  type OllamaModelResponse
} from "./ollama-normalize";

interface OllamaTagsEnvelope {
  models: OllamaModelResponse[];
}

interface OllamaGenerateEnvelope {
  response?: string;
}

interface OllamaStreamEnvelope {
  response?: string;
  done?: boolean;
}

export class OllamaAdapter implements ProviderAdapter {
  readonly id = "ollama" as const;

  async listModels(
    settings: ProviderSettingsSubset
  ): Promise<ProviderCapabilityMetadata[]> {
    const baseUrl = settings.ollamaBaseUrl.replace(/\/$/, "");
    const response = await getJson<OllamaTagsEnvelope>(`${baseUrl}/api/tags`);
    return response.models.map(normalizeOllamaModel);
  }

  async generateText(
    request: ProviderTextGenerationRequest,
    settings: ProviderSettingsSubset
  ): Promise<ProviderTextGenerationResponse> {
    const baseUrl = settings.ollamaBaseUrl.replace(/\/$/, "");
    const response = await postJson<OllamaGenerateEnvelope>(
      `${baseUrl}/api/generate`,
      {
        model: request.modelId,
        prompt: [request.systemPrompt, request.userPrompt].join("\n\n"),
        stream: false,
        options:
          request.temperature !== undefined
            ? { temperature: request.temperature }
            : undefined
      }
    );

    const text = response.response?.trim();
    if (!text) {
      throw new Error("Ollama returned an empty response.");
    }

    return { text };
  }

  async streamText(
    request: ProviderTextGenerationRequest,
    settings: ProviderSettingsSubset,
    callbacks: ProviderTextStreamCallbacks,
    options?: ProviderTextStreamOptions
  ): Promise<ProviderTextGenerationResponse> {
    const baseUrl = settings.ollamaBaseUrl.replace(/\/$/, "");
    let buffered = "";
    let text = "";

    await postStream(
      `${baseUrl}/api/generate`,
      {
        model: request.modelId,
        prompt: [request.systemPrompt, request.userPrompt].join("\n\n"),
        stream: true,
        options:
          request.temperature !== undefined
            ? { temperature: request.temperature }
            : undefined
      },
      {},
      (chunk) => {
        buffered += chunk;
        const lines = buffered.split("\n");
        buffered = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) {
            continue;
          }

          const payload = JSON.parse(trimmed) as OllamaStreamEnvelope;
          const delta = payload.response ?? "";
          if (!delta) {
            continue;
          }

          text += delta;
          callbacks.onDelta(delta);
        }
      },
      options?.signal
    );

    if (buffered.trim()) {
      const payload = JSON.parse(buffered.trim()) as OllamaStreamEnvelope;
      const delta = payload.response ?? "";
      if (delta) {
        text += delta;
        callbacks.onDelta(delta);
      }
    }

    if (!text.trim()) {
      throw new Error("Ollama returned an empty response.");
    }

    return { text: text.trim() };
  }
}
