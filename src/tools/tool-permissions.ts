import type {
  AgentAccessList,
  AgentDefinition,
  AgentNotePermissions
} from "@agents/agent-types";
import type { ToolDefinition } from "./tool-types";

export function isAccessAllowed(
  accessList: AgentAccessList,
  itemId: string
): boolean {
  switch (accessList.mode) {
    case "allow-all":
      return true;
    case "deny-all":
      return false;
    case "include":
      return accessList.items.includes(itemId);
    case "exclude":
      return !accessList.items.includes(itemId);
  }
}

export function isNoteActionAllowed(
  permissions: AgentNotePermissions,
  action: keyof AgentNotePermissions | null
): boolean {
  if (!action) {
    return true;
  }

  return permissions[action];
}

export function canAgentUseTool(
  agent: AgentDefinition,
  tool: ToolDefinition
): boolean {
  return (
    isAccessAllowed(agent.tools, tool.id) &&
    isNoteActionAllowed(agent.notes, tool.noteAction)
  );
}
