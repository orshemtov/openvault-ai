export interface AssistantCitation {
  path: string;
  reason: "retrieved" | "explicit" | "context";
}

export interface AssistantToolEvent {
  toolId: string;
  status: "allowed" | "denied" | "approval-required";
  message: string;
  output?: string;
}

export interface AssistantResponse {
  text: string;
  citations: AssistantCitation[];
  toolEvents?: AssistantToolEvent[];
}
