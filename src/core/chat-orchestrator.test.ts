import type { ProviderRegistry } from "@providers/provider-registry";
import type { ToolRuntime } from "@tools/tool-runtime";
import { ChatOrchestrator, buildUserPrompt } from "./chat-orchestrator";

describe("buildUserPrompt", () => {
  it("includes prompt context and user request", () => {
    const prompt = buildUserPrompt("Summarize this note", {
      scope: "current-note",
      title: "My note",
      description: "Using the active note.",
      notePaths: ["Notes/My note.md"],
      explicitNotePaths: ["Notes/My note.md"],
      retrievalNotePaths: ["Notes/Related.md"],
      promptContext: "Note content"
    });

    expect(prompt).toContain("Context scope: current-note");
    expect(prompt).toContain("Note content");
    expect(prompt).toContain("Summarize this note");
    expect(prompt).toContain("Grounding instructions:");
    expect(prompt).toContain("Retrieved support notes: Notes/Related.md");
  });

  it("includes recent conversation for follow-up disambiguation", () => {
    const prompt = buildUserPrompt(
      "what about noise? can we prevent noise from weights dropping?",
      {
        scope: "current-note",
        title: "Home Gym",
        description: "Using the active note.",
        notePaths: ["Fleeting/Home Gym.md"],
        explicitNotePaths: ["Fleeting/Home Gym.md"],
        promptContext:
          "Note: Fleeting/Home Gym.md\n\n- Plates\n- Deadlift platform"
      },
      [
        {
          role: "user",
          text: "Please help me restructure my home gym setup plan."
        },
        {
          role: "assistant",
          text: "I restructured the home gym plan around equipment, floor, and extras."
        }
      ]
    );

    expect(prompt).toContain("Recent conversation:");
    expect(prompt).toContain("home gym setup");
    expect(prompt).toContain(
      "Interpret ambiguous follow-up terms using the recent conversation first"
    );
  });
});

describe("ChatOrchestrator", () => {
  it("calls the provider for normal prompts", async () => {
    const registry = {
      get: () => ({
        generateText: async () => ({
          text: "provider reply mentioning My note"
        })
      })
    } as unknown as ProviderRegistry;
    const orchestrator = new ChatOrchestrator(registry);

    const reply = await orchestrator.generateReply(
      {
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
        prompt: "Summarize this note",
        contextSummary: {
          scope: "current-note",
          title: "My note",
          description: "Using the active note.",
          notePaths: ["Notes/My note.md"],
          retrievalNotePaths: ["Notes/My note.md"],
          promptContext: "Note content"
        }
      },
      {
        defaultProvider: "openrouter",
        defaultAgent: "ask",
        defaultChatModel: "openai/gpt-5.4",
        openRouterBaseUrl: "https://openrouter.ai/api/v1",
        openRouterApiKey: "",
        openAiBaseUrl: "https://api.openai.com/v1",
        openAiApiKey: "",
        anthropicBaseUrl: "https://api.anthropic.com",
        anthropicApiKey: "",
        ollamaBaseUrl: "http://127.0.0.1:11434",
        agentsRoot: "Agents",
        skillsRoot: "Skills",
        commandsRoot: "Commands",
        conversationsRoot: "AI/Conversations",
        enableDebugLogging: false,
        enableIndexingOnStartup: true
      }
    );

    expect(reply.text).toContain("provider reply");
    expect(reply.citations).toEqual([
      { path: "Notes/My note.md", reason: "retrieved" }
    ]);
  });

  it("does not attach citations when the response does not reference them", async () => {
    const registry = {
      get: () => ({
        generateText: async () => ({
          text: "General answer with no note names"
        })
      })
    } as unknown as ProviderRegistry;
    const orchestrator = new ChatOrchestrator(registry);

    const reply = await orchestrator.generateReply(
      {
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
        prompt: "Summarize this note",
        contextSummary: {
          scope: "current-note",
          title: "My note",
          description: "Using the active note.",
          notePaths: ["Notes/My note.md"],
          retrievalNotePaths: ["Notes/My note.md"],
          promptContext: "Note content"
        }
      },
      {
        defaultProvider: "openrouter",
        defaultAgent: "ask",
        defaultChatModel: "openai/gpt-5.4",
        openRouterBaseUrl: "https://openrouter.ai/api/v1",
        openRouterApiKey: "",
        openAiBaseUrl: "https://api.openai.com/v1",
        openAiApiKey: "",
        anthropicBaseUrl: "https://api.anthropic.com",
        anthropicApiKey: "",
        ollamaBaseUrl: "http://127.0.0.1:11434",
        agentsRoot: "Agents",
        skillsRoot: "Skills",
        commandsRoot: "Commands",
        conversationsRoot: "AI/Conversations",
        enableDebugLogging: false,
        enableIndexingOnStartup: true
      }
    );

    expect(reply.citations).toEqual([]);
  });

  it("streams plain replies when the adapter supports streaming", async () => {
    const deltas: string[] = [];
    const registry = {
      get: () => ({
        streamText: async (
          _request: unknown,
          _settings: unknown,
          callbacks: { onDelta: (delta: string) => void }
        ) => {
          callbacks.onDelta("Hello");
          callbacks.onDelta(" world");
          return { text: "Hello world" };
        },
        generateText: async () => ({ text: "fallback" })
      })
    } as unknown as ProviderRegistry;
    const orchestrator = new ChatOrchestrator(registry);

    const reply = await orchestrator.streamReply(
      {
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
        prompt: "Summarize this note",
        contextSummary: {
          scope: "current-note",
          title: "My note",
          description: "Using the active note.",
          notePaths: ["Notes/My note.md"],
          retrievalNotePaths: ["Notes/My note.md"],
          promptContext: "Note content"
        }
      },
      {
        defaultProvider: "openrouter",
        defaultAgent: "ask",
        defaultChatModel: "openai/gpt-5.4",
        openRouterBaseUrl: "https://openrouter.ai/api/v1",
        openRouterApiKey: "",
        openAiBaseUrl: "https://api.openai.com/v1",
        openAiApiKey: "",
        anthropicBaseUrl: "https://api.anthropic.com",
        anthropicApiKey: "",
        ollamaBaseUrl: "http://127.0.0.1:11434",
        agentsRoot: "Agents",
        skillsRoot: "Skills",
        commandsRoot: "Commands",
        conversationsRoot: "AI/Conversations",
        enableDebugLogging: false,
        enableIndexingOnStartup: true
      },
      {
        onDelta: (delta) => deltas.push(delta)
      }
    );

    expect(deltas).toEqual(["Hello", " world"]);
    expect(reply.text).toBe("Hello world");
  });

  it("executes a parsed tool call once and surfaces the tool event", async () => {
    const calls: string[] = [];
    const registry = {
      get: () => ({
        generateText: async (request: { userPrompt: string }) => {
          calls.push(request.userPrompt);
          if (calls.length === 1) {
            return {
              text: '```TOOL_CALL\n{"toolId":"read-note","input":{"path":"Notes/My note.md"}}\n```'
            };
          }

          return {
            text: "Final answer after tool output"
          };
        }
      })
    } as unknown as ProviderRegistry;
    const toolRuntime = {
      runTool: async () => ({
        status: "allowed",
        toolId: "read-note",
        message: "Tool 'read-note' completed successfully.",
        output: "Tool output"
      })
    } as unknown as ToolRuntime;
    const orchestrator = new ChatOrchestrator(registry, toolRuntime);

    const reply = await orchestrator.generateReply(
      {
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
        prompt: "Read this note",
        contextSummary: {
          scope: "current-note",
          title: "My note",
          description: "Using the active note.",
          notePaths: ["Notes/My note.md"],
          promptContext: "Note content"
        }
      },
      {
        defaultProvider: "openrouter",
        defaultAgent: "ask",
        defaultChatModel: "openai/gpt-5.4",
        openRouterBaseUrl: "https://openrouter.ai/api/v1",
        openRouterApiKey: "",
        openAiBaseUrl: "https://api.openai.com/v1",
        openAiApiKey: "",
        anthropicBaseUrl: "https://api.anthropic.com",
        anthropicApiKey: "",
        ollamaBaseUrl: "http://127.0.0.1:11434",
        agentsRoot: "Agents",
        skillsRoot: "Skills",
        commandsRoot: "Commands",
        conversationsRoot: "AI/Conversations",
        enableDebugLogging: false,
        enableIndexingOnStartup: true
      }
    );

    expect(reply.text).toContain("Final answer after tool output");
    expect(calls).toHaveLength(2);
    expect(calls[1]).toContain("Tool output:");
    expect(reply.toolEvents).toEqual([
      {
        status: "allowed",
        toolId: "read-note",
        message: "Tool 'read-note' completed successfully.",
        output: "Tool output"
      }
    ]);
  });

  it("returns a clear explanation for approval-required tool calls", async () => {
    const registry = {
      get: () => ({
        generateText: async () => ({
          text: '```TOOL_CALL\n{"toolId":"read-note","input":{"path":"Notes/My note.md"}}\n```'
        })
      })
    } as unknown as ProviderRegistry;
    const toolRuntime = {
      runTool: async () => ({
        status: "approval-required",
        toolId: "read-note",
        message:
          "Tool 'read-note' requires explicit approval before it can run."
      })
    } as unknown as ToolRuntime;
    const orchestrator = new ChatOrchestrator(registry, toolRuntime);

    const reply = await orchestrator.generateReply(
      {
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
        prompt: "Read this note",
        contextSummary: {
          scope: "current-note",
          title: "My note",
          description: "Using the active note.",
          notePaths: ["Notes/My note.md"],
          promptContext: "Note content"
        }
      },
      {
        defaultProvider: "openrouter",
        defaultAgent: "ask",
        defaultChatModel: "openai/gpt-5.4",
        openRouterBaseUrl: "https://openrouter.ai/api/v1",
        openRouterApiKey: "",
        openAiBaseUrl: "https://api.openai.com/v1",
        openAiApiKey: "",
        anthropicBaseUrl: "https://api.anthropic.com",
        anthropicApiKey: "",
        ollamaBaseUrl: "http://127.0.0.1:11434",
        agentsRoot: "Agents",
        skillsRoot: "Skills",
        commandsRoot: "Commands",
        conversationsRoot: "AI/Conversations",
        enableDebugLogging: false,
        enableIndexingOnStartup: true
      }
    );

    expect(reply.text).toContain("requires explicit approval");
    expect(reply.toolEvents?.[0]?.status).toBe("approval-required");
  });
});
