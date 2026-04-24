import type { AgentDefinition } from "@agents/agent-types";
import { BUILT_IN_TOOLS } from "./built-in-tools";
import { canAgentUseTool } from "./tool-permissions";
import type { ToolDefinition } from "./tool-types";

export class ToolRegistry {
  listTools(): ToolDefinition[] {
    return [...BUILT_IN_TOOLS];
  }

  listToolFamilies(): string[] {
    return [...new Set(BUILT_IN_TOOLS.map((tool) => tool.family))].sort();
  }

  getToolById(toolId: string): ToolDefinition | null {
    return BUILT_IN_TOOLS.find((tool) => tool.id === toolId) ?? null;
  }

  listAllowedTools(agent: AgentDefinition): ToolDefinition[] {
    return BUILT_IN_TOOLS.filter((tool) => canAgentUseTool(agent, tool));
  }
}
