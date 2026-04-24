import {
  createConversationFileName,
  isConversationPath,
  parseConversation,
  serializeConversation
} from "./conversation-format";
import type { PersistedConversation } from "./conversation-types";

describe("conversation format", () => {
  it("round-trips conversation transcripts", () => {
    const conversation: PersistedConversation = {
      sessionId: "session-1",
      path: "AI/Conversations/test.md",
      title: "Trip planning ideas",
      createdAt: "2026-04-22T21:00:00.000Z",
      updatedAt: "2026-04-22T21:05:00.000Z",
      agentId: "ask",
      providerId: "openrouter",
      modelId: "openai/gpt-5.4",
      contextScope: "current-note",
      referencedNotes: ["Notes/Project.md"],
      messages: [
        { role: "user", text: "Summarize this note", status: "done" },
        {
          role: "assistant",
          text: "Here is the summary",
          citations: [{ path: "Notes/Project.md", reason: "retrieved" }],
          toolEvents: [
            {
              toolId: "read-note",
              status: "allowed",
              message: "Tool 'read-note' completed successfully.",
              output: "Tool output"
            }
          ],
          status: "done"
        },
        { role: "assistant", text: "Request failed", status: "error" }
      ]
    };

    const serialized = serializeConversation(conversation);
    const parsed = parseConversation(serialized, conversation.path);

    expect(parsed.sessionId).toBe(conversation.sessionId);
    expect(parsed.title).toBe(conversation.title);
    expect(parsed.agentId).toBe(conversation.agentId);
    expect(parsed.referencedNotes).toEqual(conversation.referencedNotes);
    expect(parsed.messages).toEqual([
      {
        role: "user",
        text: "Summarize this note",
        status: "done",
        citations: undefined,
        toolEvents: undefined
      },
      {
        role: "assistant",
        text: "Here is the summary",
        citations: [{ path: "Notes/Project.md", reason: "retrieved" }],
        toolEvents: [
          {
            toolId: "read-note",
            status: "allowed",
            message: "read-note allowed"
          }
        ],
        status: "done"
      },
      {
        role: "assistant",
        text: "Request failed",
        status: "error",
        citations: undefined,
        toolEvents: undefined
      }
    ]);
  });

  it("identifies conversation paths by root", () => {
    expect(
      isConversationPath("AI/Conversations/test.md", "AI/Conversations")
    ).toBe(true);
    expect(isConversationPath("Notes/test.md", "AI/Conversations")).toBe(false);
  });

  it("creates markdown conversation file names", () => {
    expect(
      createConversationFileName(new Date("2026-04-22T21:00:00.000Z"))
    ).toBe("2026-04-22T21-00-00Z.md");
  });

  it("parses all supported provider ids in frontmatter", () => {
    const parsed = parseConversation(
      `---\ntype: ai-conversation\nsession_id: session-2\ntitle: Research\ncreated: 2026-04-22T21:00:00.000Z\nupdated: 2026-04-22T21:05:00.000Z\nagent: ask\nprovider: anthropic\nmodel: claude-3-7-sonnet\ncontext_scope: current-note\nreferenced_notes: []\n---\n\n## User\n\nHello`,
      "AI/Conversations/research.md"
    );

    expect(parsed.providerId).toBe("anthropic");
    expect(parsed.title).toBe("Research");
  });
});
