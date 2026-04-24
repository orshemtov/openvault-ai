import { parseAgentMarkdown } from "./agent-parser";

describe("parseAgentMarkdown", () => {
  it("parses a valid AGENT.md file", () => {
    const agent = parseAgentMarkdown(
      `---
name: Ask
description: Read assistant
mode: primary
provider: openrouter
model: openai/gpt-5.4
temperature: 0.2
notes:
  read: true
  search: true
  create: false
  edit: false
  move: false
  delete: false
tools:
  mode: allow-all
  items: []
skills:
  mode: include
  items:
    - analyze-notes
---
You are the ask agent.
`,
      "ask"
    );

    expect(agent.id).toBe("ask");
    expect(agent.mode).toBe("primary");
    expect(agent.skills.mode).toBe("include");
    expect(agent.prompt).toContain("ask agent");
  });
});
