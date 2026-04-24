import { createAssistantDraftReply } from "./assistant-reply";

describe("createAssistantDraftReply", () => {
  it("includes prompt, provider, model, and context information", () => {
    const reply = createAssistantDraftReply({
      agent: {
        id: "ask",
        name: "Ask",
        description: "Read assistant",
        mode: "primary",
        provider: "openrouter",
        model: "openai/gpt-5.4",
        temperature: 0.2,
        notes: {
          read: true,
          search: true,
          create: false,
          edit: false,
          move: false,
          delete: false
        },
        tools: {
          mode: "allow-all",
          items: []
        },
        skills: {
          mode: "allow-all",
          items: []
        },
        prompt: "You are the ask agent.",
        source: "built-in"
      },
      providerId: "openrouter",
      modelId: "openai/gpt-5.4",
      scope: "current-note",
      prompt: "Summarize this note",
      contextSummary: {
        scope: "current-note",
        title: "My note",
        description: "Using the active note.",
        notePaths: ["Notes/My note.md"],
        retrievalNotePaths: ["Notes/My note.md"],
        promptContext: "Note content"
      }
    });

    expect(reply).toContain("openrouter/openai/gpt-5.4");
    expect(reply).toContain("Summarize this note");
    expect(reply).toContain("Notes/My note.md");
  });
});
