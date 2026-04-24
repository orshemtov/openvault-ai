export interface CommandDefinition {
  id: string;
  description: string;
  template: string;
  agent?: string;
  model?: string;
  source: "vault";
  path?: string;
}

export interface ParsedCommandInvocation {
  commandId: string;
  argumentsText: string;
}
