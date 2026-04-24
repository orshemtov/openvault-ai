import type { AgentDefinition } from "@agents/agent-types";
import type { VaultAiPluginSettings, ProviderId } from "@app/settings";
import type { AssistantResponse } from "@core/assistant-response";
import type { ResolvedContextSummary } from "@core/context-types";
import type { ProviderRegistry } from "@providers/provider-registry";
import type {
  ToolCallInput,
  ToolRunResult,
  ToolRuntime
} from "@tools/tool-runtime";

export interface ChatRequestInput {
  agent: AgentDefinition;
  providerId: ProviderId;
  modelId: string;
  prompt: string;
  contextSummary: ResolvedContextSummary;
  recentMessages?: Array<{
    role: "user" | "assistant";
    text: string;
  }>;
}

export interface ConversationTitleInput {
  providerId: ProviderId;
  modelId: string;
  firstUserMessage: string;
  firstAssistantMessage: string;
}

export interface StreamReplyCallbacks {
  onDelta: (delta: string) => void;
}

export interface StreamReplyOptions {
  signal?: AbortSignal;
}

export class ChatOrchestrator {
  constructor(
    private readonly registry: ProviderRegistry,
    private readonly toolRuntime?: ToolRuntime
  ) {}

  async generateReply(
    input: ChatRequestInput,
    settings: VaultAiPluginSettings
  ): Promise<AssistantResponse> {
    const adapter = this.registry.get(input.providerId);
    if (!adapter) {
      throw new Error(`Provider '${input.providerId}' is not registered.`);
    }

    const response = await adapter.generateText(
      {
        modelId: input.modelId,
        systemPrompt: input.agent.prompt,
        userPrompt: buildUserPrompt(
          input.prompt,
          input.contextSummary,
          input.recentMessages
        ),
        temperature: input.agent.temperature
      },
      settings
    );

    const citations = createCitations(response.text, input.contextSummary);
    const toolCall = parseToolCall(response.text);
    if (toolCall && this.toolRuntime) {
      const toolResult = await this.toolRuntime.runTool(input.agent, toolCall);
      if (toolResult.status === "allowed" && toolResult.output) {
        const followUp = await adapter.generateText(
          {
            modelId: input.modelId,
            systemPrompt: input.agent.prompt,
            userPrompt: buildToolFollowUpPrompt(
              input.prompt,
              input.contextSummary,
              input.recentMessages,
              toolCall,
              toolResult.output
            ),
            temperature: input.agent.temperature
          },
          settings
        );

        return {
          text: followUp.text,
          citations,
          toolEvents: [toolResult]
        };
      }

      if (
        toolResult.status === "denied" ||
        toolResult.status === "approval-required"
      ) {
        return {
          text: appendToolResult(
            response.text,
            buildBlockedToolExplanation(toolResult),
            citations
          ),
          citations,
          toolEvents: [toolResult]
        };
      }

      return {
        text: appendToolResult(response.text, toolResult.message, citations),
        citations,
        toolEvents: [toolResult]
      };
    }

    return {
      text: response.text,
      citations
    };
  }

  async streamReply(
    input: ChatRequestInput,
    settings: VaultAiPluginSettings,
    callbacks: StreamReplyCallbacks,
    options: StreamReplyOptions = {}
  ): Promise<AssistantResponse> {
    const adapter = this.registry.get(input.providerId);
    if (!adapter) {
      throw new Error(`Provider '${input.providerId}' is not registered.`);
    }

    if (!adapter.streamText) {
      return this.generateReply(input, settings);
    }

    const response = await adapter.streamText(
      {
        modelId: input.modelId,
        systemPrompt: input.agent.prompt,
        userPrompt: buildUserPrompt(
          input.prompt,
          input.contextSummary,
          input.recentMessages
        ),
        temperature: input.agent.temperature
      },
      settings,
      callbacks,
      options
    );
    const citations = createCitations(response.text, input.contextSummary);

    return {
      text: response.text,
      citations
    };
  }

  async generateConversationTitle(
    input: ConversationTitleInput,
    settings: VaultAiPluginSettings
  ): Promise<string> {
    const adapter = this.registry.get(input.providerId);
    if (!adapter) {
      throw new Error(`Provider '${input.providerId}' is not registered.`);
    }

    const response = await adapter.generateText(
      {
        modelId: input.modelId,
        systemPrompt:
          "You write concise conversation titles for the Vault AI chat app. Return only a short title of 2 to 6 words, with no quotes, no markdown, and no trailing punctuation.",
        userPrompt: [
          "Write a short title for this new chat.",
          `User: ${input.firstUserMessage}`,
          `Assistant: ${input.firstAssistantMessage}`
        ].join("\n\n"),
        temperature: 0.2
      },
      settings
    );

    const title = normalizeConversationTitle(response.text);
    if (!title) {
      throw new Error("Generated conversation title was empty.");
    }

    return title;
  }
}

export function buildUserPrompt(
  prompt: string,
  contextSummary: ResolvedContextSummary,
  recentMessages: ChatRequestInput["recentMessages"] = []
): string {
  const groundingLines = [
    "Grounding instructions:",
    "- Prefer facts supported by the supplied context.",
    "- If the retrieved context is incomplete or conflicting, say so.",
    "- Do not claim a note was used unless it appears in the provided sources.",
    contextSummary.retrievalNotePaths &&
    contextSummary.retrievalNotePaths.length > 0
      ? `Retrieved support notes: ${contextSummary.retrievalNotePaths.join(", ")}`
      : "Retrieved support notes: none",
    contextSummary.explicitNotePaths &&
    contextSummary.explicitNotePaths.length > 0
      ? `Explicitly mentioned notes: ${contextSummary.explicitNotePaths.join(", ")}`
      : "Explicitly mentioned notes: none"
  ];

  return [
    `Context scope: ${contextSummary.scope}`,
    `Context title: ${contextSummary.title}`,
    `Context description: ${contextSummary.description}`,
    `Referenced note paths: ${contextSummary.notePaths.length > 0 ? contextSummary.notePaths.join(", ") : "none"}`,
    ...groundingLines,
    recentMessages.length > 0
      ? [
          "Recent conversation:",
          recentMessages
            .map(
              (message) =>
                `${message.role === "user" ? "User" : "Assistant"}: ${message.text}`
            )
            .join("\n\n"),
          "Interpret ambiguous follow-up terms using the recent conversation first, then the supplied note context. Stay on the current topic unless the user clearly changes it."
        ].join("\n\n")
      : "",
    "Context content:",
    contextSummary.promptContext,
    "User request:",
    prompt
  ].join("\n\n");
}

function createCitations(
  responseText: string,
  contextSummary: ResolvedContextSummary
): AssistantResponse["citations"] {
  const normalizedResponse = responseText.toLowerCase();
  const citations = [
    ...(contextSummary.explicitNotePaths ?? []).map((path) => ({
      path,
      reason: "explicit" as const
    })),
    ...(contextSummary.retrievalNotePaths ?? []).map((path) => ({
      path,
      reason: "retrieved" as const
    }))
  ];

  return dedupeCitations(citations).filter((citation) =>
    responseReferencesPath(normalizedResponse, citation.path)
  );
}

function responseReferencesPath(responseText: string, path: string): boolean {
  const basename = path.split("/").pop()?.replace(/\.md$/i, "") ?? path;
  const normalizedBasename = basename.toLowerCase();
  const normalizedPath = path.toLowerCase();

  return (
    responseText.includes(normalizedPath) ||
    responseText.includes(normalizedBasename) ||
    responseText.includes(`[[${normalizedPath}]]`) ||
    responseText.includes(`[[${normalizedBasename}]]`)
  );
}

function dedupeCitations(citations: AssistantResponse["citations"]) {
  const seen = new Set<string>();
  return citations.filter((citation) => {
    if (seen.has(citation.path)) {
      return false;
    }

    seen.add(citation.path);
    return true;
  });
}

function appendToolResult(
  text: string,
  toolMessage: string,
  citations: AssistantResponse["citations"]
): string {
  const withoutToolCall = text.replace(/```TOOL_CALL[\s\S]*?```/g, "").trim();
  void citations;
  return `${withoutToolCall}\n\nTool result: ${toolMessage}`.trim();
}

function buildToolFollowUpPrompt(
  prompt: string,
  contextSummary: ResolvedContextSummary,
  recentMessages: ChatRequestInput["recentMessages"],
  toolCall: ToolCallInput,
  toolOutput: string
): string {
  return [
    buildUserPrompt(prompt, contextSummary, recentMessages),
    "Tool call executed:",
    JSON.stringify(toolCall, null, 2),
    "Tool output:",
    toolOutput,
    "Now answer the user directly using the tool output and supplied context."
  ].join("\n\n");
}

function buildBlockedToolExplanation(toolResult: ToolRunResult): string {
  if (toolResult.status === "approval-required") {
    return `The agent requested tool '${toolResult.toolId}', but it requires explicit approval before it can run. ${toolResult.message}`;
  }

  return `The agent requested tool '${toolResult.toolId}', but it was blocked by policy. ${toolResult.message}`;
}

function parseToolCall(text: string): ToolCallInput | null {
  const match = text.match(/```TOOL_CALL\n([\s\S]*?)\n```/);
  if (!match) {
    return null;
  }

  try {
    const parsed = JSON.parse(match[1]);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("toolId" in parsed) ||
      typeof parsed.toolId !== "string" ||
      !("input" in parsed) ||
      typeof parsed.input !== "object" ||
      parsed.input === null ||
      Array.isArray(parsed.input)
    ) {
      return null;
    }

    return {
      toolId: parsed.toolId,
      input: parsed.input as Record<string, unknown>
    };
  } catch {
    return null;
  }
}

function normalizeConversationTitle(text: string): string {
  const candidate = text
    .trim()
    .replace(/^['"`]+|['"`]+$/g, "")
    .replace(/^[#*\-\d.\s]+/, "")
    .replace(/[:.!?]+$/g, "")
    .split(/\r?\n/)[0]
    ?.trim();

  if (!candidate) {
    return "";
  }

  return candidate.slice(0, 80).trim();
}
