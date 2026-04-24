import type {
  AssistantCitation,
  AssistantToolEvent
} from "@core/assistant-response";
import type { ProviderId } from "@app/settings";
import type { ContextScope } from "@core/context-types";

export interface StoredConversationMessage {
  role: "user" | "assistant";
  text: string;
  citations?: AssistantCitation[];
  toolEvents?: AssistantToolEvent[];
  status?: "error" | "done";
}

export interface PersistedConversation {
  sessionId: string;
  path: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  agentId: string;
  providerId: ProviderId;
  modelId: string;
  contextScope: ContextScope;
  referencedNotes: string[];
  messages: StoredConversationMessage[];
}

export interface SaveConversationInput {
  title?: string;
  agentId: string;
  providerId: ProviderId;
  modelId: string;
  contextScope: ContextScope;
  referencedNotes: string[];
  messages: StoredConversationMessage[];
}
