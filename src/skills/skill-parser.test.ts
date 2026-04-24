import { parseSkillMarkdown } from "./skill-parser";

describe("parseSkillMarkdown", () => {
  it("parses a valid SKILL.md file", () => {
    const skill = parseSkillMarkdown(
      `---
name: Summarize Notes
description: Summarize a note collection
---
Summarize related notes and return the key takeaways.
`,
      "summarize-notes"
    );

    expect(skill.id).toBe("summarize-notes");
    expect(skill.name).toBe("Summarize Notes");
    expect(skill.description).toContain("note collection");
    expect(skill.prompt).toContain("key takeaways");
  });
});
