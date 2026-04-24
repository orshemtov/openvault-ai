import type { ProviderId } from "@app/settings";

export type AgentMode = "primary" | "subagent";
export type AgentAccessMode = "allow-all" | "deny-all" | "include" | "exclude";

export interface AgentAccessList {
  mode: AgentAccessMode;
  items: string[];
}

export interface AgentNotePermissions {
  read: boolean;
  search: boolean;
  create: boolean;
  edit: boolean;
  move: boolean;
  delete: boolean;
}

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  mode: AgentMode;
  provider: ProviderId;
  model: string;
  temperature: number;
  notes: AgentNotePermissions;
  tools: AgentAccessList;
  skills: AgentAccessList;
  prompt: string;
  source: "built-in" | "vault";
  path?: string;
}
