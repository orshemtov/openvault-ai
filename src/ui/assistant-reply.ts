import type { AssistantDraftRequest } from "./assistant-state";

export function createAssistantDraftReply(
  request: AssistantDraftRequest
): string {
  const contextLine = `${request.contextSummary.title}: ${request.contextSummary.description}`;
  const noteLine =
    request.contextSummary.notePaths.length > 0
      ? `Context notes: ${request.contextSummary.notePaths.join(", ")}`
      : "Context notes: none";
  const selectionLine = request.contextSummary.selectionPreview
    ? `Selection preview: ${request.contextSummary.selectionPreview}`
    : "";

  return [
    `Stub assistant response for ${request.agent.id} using ${request.providerId}/${request.modelId}.`,
    contextLine,
    noteLine,
    selectionLine,
    `Prompt captured: ${request.prompt}`,
    "Next implementation step is to replace this stub with real request orchestration and vault-aware retrieval."
  ]
    .filter(Boolean)
    .join("\n\n");
}
