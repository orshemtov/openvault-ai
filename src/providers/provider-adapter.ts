import type { ProviderId } from "@app/settings";
import type {
  ProviderCapabilityMetadata,
  ProviderSettingsSubset,
  ProviderTextGenerationRequest,
  ProviderTextStreamCallbacks,
  ProviderTextStreamOptions,
  ProviderTextGenerationResponse
} from "./provider-runtime";

export interface ProviderAdapter {
  readonly id: ProviderId;
  listModels(
    settings: ProviderSettingsSubset
  ): Promise<ProviderCapabilityMetadata[]>;
  generateText(
    request: ProviderTextGenerationRequest,
    settings: ProviderSettingsSubset
  ): Promise<ProviderTextGenerationResponse>;
  streamText?(
    request: ProviderTextGenerationRequest,
    settings: ProviderSettingsSubset,
    callbacks: ProviderTextStreamCallbacks,
    options?: ProviderTextStreamOptions
  ): Promise<ProviderTextGenerationResponse>;
}
