import type { ProviderId } from "@app/settings";
import type { ProviderAdapter } from "./provider-adapter";

export class ProviderRegistry {
  private readonly adapters = new Map<ProviderId, ProviderAdapter>();

  register(adapter: ProviderAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  get(providerId: ProviderId): ProviderAdapter | undefined {
    return this.adapters.get(providerId);
  }

  list(): ProviderAdapter[] {
    return [...this.adapters.values()];
  }
}
