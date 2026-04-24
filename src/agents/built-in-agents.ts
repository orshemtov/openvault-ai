import type { AgentDefinition } from "./agent-types";

export const BUILT_IN_AGENTS: AgentDefinition[] = [
  {
    id: "ask",
    name: "Ask",
    description: "Read-oriented assistant for asking questions about notes.",
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
    prompt:
      'You are the main read-oriented assistant for this Obsidian vault. Answer using the selected note context, cite notes clearly, and avoid proposing edits unless the user switches to a write-capable agent. If you need exactly one tool, respond with a fenced TOOL_CALL JSON block like ```TOOL_CALL {"toolId":"read-note","input":{...}}```.',
    source: "built-in"
  },
  {
    id: "edit",
    name: "Edit",
    description:
      "Write-capable assistant for updating and restructuring notes.",
    mode: "primary",
    provider: "openrouter",
    model: "openai/gpt-5.4",
    temperature: 0.2,
    notes: {
      read: true,
      search: true,
      create: true,
      edit: true,
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
    prompt:
      'You are the main edit-oriented assistant for this Obsidian vault. Help rewrite, restructure, and improve notes safely. Keep changes reviewable and do not perform destructive actions without explicit approval. If you need exactly one tool, respond with a fenced TOOL_CALL JSON block like ```TOOL_CALL {"toolId":"read-note","input":{...}}```.',
    source: "built-in"
  }
];
