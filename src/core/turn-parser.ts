import type { AgentDefinition } from "@agents/agent-types";
import type { CommandDefinition } from "../commands/command-types";
import { parseCommandInvocation } from "../commands/command-parser";

export interface MentionSuggestion {
  id: string;
  label: string;
  type: "agent" | "note" | "folder" | "context";
  insertText: string;
  description: string;
  detail?: string;
}

export interface ParsedTurnInput {
  prompt: string;
  agentId?: string;
  noteMentions: string[];
  includeAllNotes?: boolean;
  command?: CommandDefinition;
}

export async function parseTurnInput(options: {
  prompt: string;
  agents: AgentDefinition[];
  expandCommand: (
    commandId: string,
    argumentsText: string
  ) => Promise<{
    command: CommandDefinition;
    prompt: string;
  } | null>;
}): Promise<ParsedTurnInput> {
  const trimmedPrompt = options.prompt.trim();
  const commandInvocation = parseCommandInvocation(trimmedPrompt);
  let prompt = trimmedPrompt;
  let command: CommandDefinition | undefined;
  let agentId = command?.agent;
  let includeAllNotes = false;

  if (commandInvocation) {
    const expanded = await options.expandCommand(
      commandInvocation.commandId,
      commandInvocation.argumentsText
    );

    if (!expanded) {
      throw new Error(
        `Command '/${commandInvocation.commandId}' was not found.`
      );
    }

    command = expanded.command;
    prompt = expanded.prompt;
    agentId = command.agent;
  }

  const extractedNotes = new Set<string>();
  const mentionMatches = [
    ...prompt.matchAll(/(^|\s)([@#])(?:"([^"\n]+)"|([^\s]+))/g)
  ];

  for (const match of mentionMatches) {
    const mentionId = (match[3] ?? match[4] ?? "").trim();
    const matchingAgent = options.agents.find(
      (agent) =>
        agent.id === mentionId || normalizeLabel(agent.name) === mentionId
    );

    if (matchingAgent && match.index === 0 && !match[3]) {
      agentId = matchingAgent.id;
      const matchedToken = match[0].trimStart();
      prompt = prompt.slice(matchedToken.length).trim();
      continue;
    }

    if (matchingAgent) {
      continue;
    }

    if (mentionId.toLowerCase() === "all") {
      includeAllNotes = true;
      continue;
    }

    extractedNotes.add(mentionId);
  }

  return {
    prompt,
    agentId,
    noteMentions: [...extractedNotes],
    includeAllNotes,
    command
  };
}

export function getCommandSuggestions(
  prompt: string,
  commands: CommandDefinition[]
): CommandDefinition[] {
  const token = getActiveToken(prompt);
  if (!token || token.trigger !== "/") {
    return [];
  }

  const query = token.query.toLowerCase().replace(/^\/+/, "");
  return commands.filter(
    (command) =>
      command.id.toLowerCase().includes(query) ||
      command.description.toLowerCase().includes(query)
  );
}

export function getMentionSuggestions(options: {
  prompt: string;
  agents: AgentDefinition[];
  notePaths: string[];
}): MentionSuggestion[] {
  const token = getActiveToken(options.prompt);
  if (!token || (token.trigger !== "@" && token.trigger !== "#")) {
    return [];
  }

  const query = token.query.toLowerCase();
  const trigger = token.trigger;
  const specialSuggestions = "all".includes(query)
    ? [
        {
          id: "all",
          label: `${trigger}all`,
          type: "context" as const,
          insertText: `${trigger}all`,
          description: "All notes",
          detail: "Use the whole vault as context"
        }
      ]
    : [];
  const agentSuggestions = options.agents
    .filter(
      (agent) =>
        agent.id.toLowerCase().includes(query) ||
        agent.name.toLowerCase().includes(query)
    )
    .map((agent) => ({
      id: agent.id,
      label: `${trigger}${agent.id}`,
      type: "agent" as const,
      insertText: `${trigger}${agent.id}`,
      description: agent.name,
      detail: "Agent"
    }));
  const folderSuggestions = getFolderSuggestions(options.notePaths)
    .filter((path) => path.toLowerCase().includes(query))
    .slice(0, 4)
    .map((path) => ({
      id: path,
      label: `${trigger}${path}`,
      type: "folder" as const,
      insertText: `${trigger}${path}`,
      description: lastPathSegment(path.slice(0, -1)) || path,
      detail: path
    }));
  const noteSuggestions = options.notePaths
    .filter((path) => path.toLowerCase().includes(query))
    .slice(0, 8)
    .map((path) => ({
      id: path,
      label: `${trigger}${lastPathSegment(path)}`,
      type: "note" as const,
      insertText: formatMentionInsertText(trigger, path),
      description: lastPathSegment(path),
      detail: path
    }));

  return [
    ...specialSuggestions,
    ...agentSuggestions,
    ...folderSuggestions,
    ...noteSuggestions
  ].slice(0, 10);
}

export function applySuggestion(prompt: string, insertText: string): string {
  const token = getActiveToken(prompt);
  if (!token) {
    return prompt;
  }

  const before = prompt.slice(0, token.start);
  const after = prompt.slice(token.end);

  return `${before}${insertText}${after}`;
}

function getActiveToken(prompt: string): {
  trigger: "/" | "@" | "#";
  query: string;
  start: number;
  end: number;
} | null {
  const match = prompt.match(/(^|\s)([@/#])([^\n]*)$/);
  if (!match || match.index === undefined) {
    return null;
  }

  const prefix = match[1] ?? "";
  const trigger = match[2] as "/" | "@" | "#";
  const query = (match[3] ?? "").trimStart();
  const start = match.index + prefix.length;

  if (trigger === "/" && query.includes(" ")) {
    return null;
  }

  if ((trigger === "@" || trigger === "#") && query.includes("@")) {
    return null;
  }

  return {
    trigger,
    query,
    start,
    end: prompt.length
  };
}

function normalizeLabel(label: string): string {
  return label.toLowerCase().replace(/\s+/g, "-");
}

function getFolderSuggestions(notePaths: string[]): string[] {
  const folders = new Set<string>();

  for (const path of notePaths) {
    const segments = path.split("/").filter(Boolean);
    for (let index = 1; index < segments.length; index += 1) {
      folders.add(`${segments.slice(0, index).join("/")}/`);
    }
  }

  return [...folders].sort((left, right) => left.localeCompare(right));
}

function lastPathSegment(path: string): string {
  const segments = path.split("/");
  return segments[segments.length - 1] ?? path;
}

function formatMentionInsertText(trigger: "@" | "#", path: string): string {
  return /\s/.test(path) ? `${trigger}"${path}"` : `${trigger}${path}`;
}
