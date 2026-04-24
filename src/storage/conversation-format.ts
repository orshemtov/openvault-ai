import { providerIdSchema } from "../app/settings";
import matter from "gray-matter";
import { z } from "zod";
import type {
  PersistedConversation,
  StoredConversationMessage
} from "./conversation-types";

const conversationFrontmatterSchema = z.object({
  type: z.literal("ai-conversation"),
  session_id: z.string().min(1),
  title: z.string().min(1).default("New chat"),
  created: z.union([z.string().min(1), z.date()]).transform(normalizeDateValue),
  updated: z.union([z.string().min(1), z.date()]).transform(normalizeDateValue),
  agent: z.string().min(1),
  provider: providerIdSchema,
  model: z.string().min(1),
  context_scope: z.enum(["current-note", "selection", "whole-vault"]),
  referenced_notes: z.array(z.string()).default([])
});

export function serializeConversation(
  conversation: PersistedConversation
): string {
  return matter.stringify(formatConversationBody(conversation.messages), {
    type: "ai-conversation",
    session_id: conversation.sessionId,
    title: conversation.title,
    created: conversation.createdAt,
    updated: conversation.updatedAt,
    agent: conversation.agentId,
    provider: conversation.providerId,
    model: conversation.modelId,
    context_scope: conversation.contextScope,
    referenced_notes: conversation.referencedNotes
  });
}

export function parseConversation(
  fileContent: string,
  path: string
): PersistedConversation {
  const parsed = matter(fileContent);
  const frontmatter = conversationFrontmatterSchema.parse(parsed.data);

  return {
    sessionId: frontmatter.session_id,
    path,
    title: frontmatter.title,
    createdAt: frontmatter.created,
    updatedAt: frontmatter.updated,
    agentId: frontmatter.agent,
    providerId: frontmatter.provider,
    modelId: frontmatter.model,
    contextScope: frontmatter.context_scope,
    referencedNotes: frontmatter.referenced_notes,
    messages: parseConversationBody(parsed.content)
  };
}

export function isConversationPath(
  path: string,
  conversationsRoot: string
): boolean {
  return path === conversationsRoot || path.startsWith(`${conversationsRoot}/`);
}

export function createConversationFileName(date = new Date()): string {
  return `${date
    .toISOString()
    .replace(/:/g, "-")
    .replace(/\.\d{3}Z$/, "Z")}.md`;
}

export function createConversationSessionId(date = new Date()): string {
  return `session-${date.toISOString()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatConversationBody(messages: StoredConversationMessage[]): string {
  return messages
    .map((message) => {
      const title = message.role === "user" ? "User" : "Assistant";
      const statusBlock =
        message.status === "error" ? "\n\n_Status: error_" : "";
      const citationsBlock =
        message.citations && message.citations.length > 0
          ? `\n\n_Citations: ${message.citations.map((citation) => citation.path).join(", ")}_`
          : "";
      const toolsBlock =
        message.toolEvents && message.toolEvents.length > 0
          ? `\n\n_Tools: ${message.toolEvents
              .map((tool) => `${tool.toolId}:${tool.status}`)
              .join(", ")}_`
          : "";

      return [
        `## ${title}`,
        `${statusBlock}${citationsBlock}${toolsBlock}\n\n${message.text}`.trim()
      ].join("\n\n");
    })
    .join("\n\n");
}

function parseConversationBody(body: string): StoredConversationMessage[] {
  const sections = body
    .split(/^## /m)
    .map((section) => section.trim())
    .filter(Boolean);

  return sections.map((section) => {
    const [heading, ...rest] = section.split("\n\n");
    const role = heading === "User" ? "user" : "assistant";
    const block = rest.join("\n\n").trim();
    const statusMatch = block.match(
      /^(?:_Status: (error)_\n\n)?(?:_Citations: ([^\n]+)_\n\n)?(?:_Tools: ([^\n]+)_\n\n)?([\s\S]*)$/
    );

    if (statusMatch) {
      return {
        role,
        status: (statusMatch[1] as "error" | undefined) ?? "done",
        citations: statusMatch[2]
          ? statusMatch[2]
              .split(", ")
              .map((path) => ({ path, reason: "retrieved" as const }))
          : undefined,
        toolEvents: statusMatch[3]
          ? statusMatch[3].split(", ").map((entry) => {
              const [toolId, status] = entry.split(":");
              return {
                toolId,
                status: status as "allowed" | "denied" | "approval-required",
                message: `${toolId} ${status}`
              };
            })
          : undefined,
        text: statusMatch[4].trim()
      };
    }

    return {
      role,
      status: "done",
      text: block
    };
  });
}

function normalizeDateValue(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}
