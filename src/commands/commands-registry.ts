import { App, normalizePath } from "obsidian";
import { applyCommandTemplate, parseCommandMarkdown } from "./command-parser";
import type { CommandDefinition } from "./command-types";

const DEFAULT_COMMANDS_ROOT = "Commands";

export class CommandsRegistry {
  constructor(
    private readonly app: App,
    private readonly commandsRoot: string = DEFAULT_COMMANDS_ROOT
  ) {}

  getCommandsRoot(): string {
    return this.commandsRoot;
  }

  async listCommands(): Promise<CommandDefinition[]> {
    const normalizedRoot = normalizePath(this.commandsRoot);
    const files = this.app.vault
      .getMarkdownFiles()
      .filter((file) => isCommandPath(file.path, normalizedRoot));

    const commands = await Promise.all(
      files.map(async (file) => {
        const commandId = file.basename;
        const content = await this.app.vault.cachedRead(file);

        try {
          return parseCommandMarkdown(content, commandId, file.path);
        } catch {
          return null;
        }
      })
    );

    return commands
      .filter((command): command is CommandDefinition => command !== null)
      .sort((left, right) => left.id.localeCompare(right.id));
  }

  async getCommandById(commandId: string): Promise<CommandDefinition | null> {
    const commands = await this.listCommands();
    return commands.find((command) => command.id === commandId) ?? null;
  }

  async expandCommand(
    commandId: string,
    argumentsText: string
  ): Promise<{ command: CommandDefinition; prompt: string } | null> {
    const command = await this.getCommandById(commandId);
    if (!command) {
      return null;
    }

    return {
      command,
      prompt: applyCommandTemplate(command, argumentsText)
    };
  }
}

function isCommandPath(path: string, commandsRoot: string): boolean {
  if (!path.startsWith(`${commandsRoot}/`)) {
    return false;
  }

  const relativePath = path.slice(commandsRoot.length + 1);
  return !relativePath.includes("/");
}
