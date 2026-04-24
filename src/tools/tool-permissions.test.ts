import type { AgentDefinition } from "../agents/agent-types";
import { BUILT_IN_AGENTS } from "../agents/built-in-agents";
import { canAgentUseTool, isAccessAllowed } from "./tool-permissions";
import { ToolRegistry } from "./tool-registry";

describe("tool permissions", () => {
  it("respects access list modes", () => {
    expect(isAccessAllowed({ mode: "allow-all", items: [] }, "read-note")).toBe(
      true
    );
    expect(isAccessAllowed({ mode: "deny-all", items: [] }, "read-note")).toBe(
      false
    );
    expect(
      isAccessAllowed({ mode: "include", items: ["read-note"] }, "read-note")
    ).toBe(true);
    expect(
      isAccessAllowed({ mode: "exclude", items: ["read-note"] }, "read-note")
    ).toBe(false);
  });

  it("filters built-in tools by note permissions", () => {
    const registry = new ToolRegistry();
    const askAgent = BUILT_IN_AGENTS.find((agent) => agent.id === "ask");

    expect(askAgent).toBeDefined();

    const allowedToolIds = registry
      .listAllowedTools(askAgent as AgentDefinition)
      .map((tool) => tool.id);

    expect(allowedToolIds).toContain("read-note");
    expect(allowedToolIds).toContain("search-notes");
    expect(allowedToolIds).not.toContain("create-note");
    expect(allowedToolIds).not.toContain("update-note");
  });

  it("blocks a tool when the agent excludes it", () => {
    const registry = new ToolRegistry();
    const tool = registry.getToolById("read-note");
    const restrictedAgent: AgentDefinition = {
      ...BUILT_IN_AGENTS[0],
      tools: {
        mode: "exclude",
        items: ["read-note"]
      }
    };

    expect(tool).not.toBeNull();
    expect(canAgentUseTool(restrictedAgent, tool!)).toBe(false);
  });
});
