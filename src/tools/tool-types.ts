import type { AgentNotePermissions } from "@agents/agent-types";

export type ToolSource = "built-in" | "vault";
export type ToolPermissionAction = keyof AgentNotePermissions | null;

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  family: string;
  noteAction: ToolPermissionAction;
  requiresApproval: boolean;
  source: ToolSource;
}
