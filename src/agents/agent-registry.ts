import { App, normalizePath } from "obsidian";
import { BUILT_IN_AGENTS } from "./built-in-agents";
import { parseAgentMarkdown } from "./agent-parser";
import type { AgentDefinition } from "./agent-types";

const DEFAULT_AGENTS_ROOT = "Agents";

export class AgentRegistry {
  constructor(private readonly app: App) {}

  async listAgents(
    agentsRoot = DEFAULT_AGENTS_ROOT
  ): Promise<AgentDefinition[]> {
    const builtIns = new Map(BUILT_IN_AGENTS.map((agent) => [agent.id, agent]));
    const vaultAgents = await this.loadVaultAgents(agentsRoot);

    for (const agent of vaultAgents) {
      builtIns.set(agent.id, agent);
    }

    return [...builtIns.values()].sort((left, right) =>
      left.name.localeCompare(right.name)
    );
  }

  async getPrimaryAgents(
    agentsRoot = DEFAULT_AGENTS_ROOT
  ): Promise<AgentDefinition[]> {
    const agents = await this.listAgents(agentsRoot);
    return agents.filter((agent) => agent.mode === "primary");
  }

  async getAgentById(
    agentId: string,
    agentsRoot = DEFAULT_AGENTS_ROOT
  ): Promise<AgentDefinition | null> {
    const agents = await this.listAgents(agentsRoot);
    return agents.find((agent) => agent.id === agentId) ?? null;
  }

  private async loadVaultAgents(
    agentsRoot: string
  ): Promise<AgentDefinition[]> {
    const normalizedRoot = normalizePath(agentsRoot);
    const files = this.app.vault
      .getMarkdownFiles()
      .filter(
        (file) =>
          file.path.startsWith(`${normalizedRoot}/`) && file.name === "AGENT.md"
      );

    const parsedAgents = await Promise.all(
      files.map(async (file) => {
        const folderSegments = file.path.split("/");
        const agentId = folderSegments[folderSegments.length - 2];
        if (!agentId) {
          return null;
        }

        const content = await this.app.vault.cachedRead(file);
        try {
          return parseAgentMarkdown(content, agentId, file.path);
        } catch {
          return null;
        }
      })
    );

    return parsedAgents.filter(
      (agent): agent is AgentDefinition => agent !== null
    );
  }
}
