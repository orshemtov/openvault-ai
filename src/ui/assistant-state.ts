import type { ProviderId } from "@app/settings";
import type { AgentDefinition } from "@agents/agent-types";
import type {
  AssistantCitation,
  AssistantToolEvent
} from "@core/assistant-response";
import type { ContextScope, ResolvedContextSummary } from "@core/context-types";

export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  citations?: AssistantCitation[];
  toolEvents?: AssistantToolEvent[];
  status?: "pending" | "error" | "done";
}

export interface AssistantDraftRequest {
  agent: AgentDefinition;
  providerId: ProviderId;
  modelId: string;
  scope: ContextScope;
  prompt: string;
  contextSummary: ResolvedContextSummary;
}

export function createMessage(
  role: AssistantMessage["role"],
  text: string,
  status: AssistantMessage["status"] = "done",
  citations?: AssistantCitation[],
  toolEvents?: AssistantToolEvent[]
): AssistantMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
    citations,
    toolEvents,
    status
  };
}
