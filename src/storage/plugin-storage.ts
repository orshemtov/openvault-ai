import type { Plugin } from "obsidian";

export interface PluginStoredState<TSettings> {
  settings: TSettings;
  activeConversationPath: string | null;
  assistantState?: {
    providerId?: string;
    modelId?: string;
    agentId?: string;
  };
}

export class PluginStorage {
  constructor(private readonly plugin: Plugin) {}

  async load<T>(fallback: T): Promise<T> {
    const stored = (await this.plugin.loadData()) as unknown;

    if (isPluginStoredState(stored)) {
      return stored.settings as T;
    }

    return (stored as T | null) ?? fallback;
  }

  async save<T>(value: T): Promise<void> {
    const current =
      (await this.plugin.loadData()) as PluginStoredState<T> | null;
    await this.plugin.saveData({
      settings: value,
      activeConversationPath: current?.activeConversationPath ?? null,
      assistantState: current?.assistantState
    } satisfies PluginStoredState<T>);
  }

  async loadActiveConversationPath(): Promise<string | null> {
    const stored =
      (await this.plugin.loadData()) as PluginStoredState<unknown> | null;
    return stored?.activeConversationPath ?? null;
  }

  async saveActiveConversationPath(path: string | null): Promise<void> {
    const current =
      (await this.plugin.loadData()) as PluginStoredState<unknown> | null;
    await this.plugin.saveData({
      settings: current?.settings ?? null,
      activeConversationPath: path,
      assistantState: current?.assistantState
    });
  }

  async loadAssistantState(): Promise<
    PluginStoredState<unknown>["assistantState"]
  > {
    const stored =
      (await this.plugin.loadData()) as PluginStoredState<unknown> | null;
    return stored?.assistantState;
  }

  async saveAssistantState(state: {
    providerId?: string;
    modelId?: string;
    agentId?: string;
  }): Promise<void> {
    const current =
      (await this.plugin.loadData()) as PluginStoredState<unknown> | null;
    await this.plugin.saveData({
      settings: current?.settings ?? null,
      activeConversationPath: current?.activeConversationPath ?? null,
      assistantState: state
    });
  }
}

function isPluginStoredState(
  value: unknown
): value is PluginStoredState<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "settings" in value &&
    "activeConversationPath" in value
  );
}
