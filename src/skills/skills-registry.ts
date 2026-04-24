import type { AgentDefinition } from "@agents/agent-types";
import { isAccessAllowed } from "@tools/tool-permissions";
import { App, normalizePath } from "obsidian";
import { parseSkillMarkdown } from "./skill-parser";
import type { SkillDefinition } from "./skill-types";

const BUILT_IN_SKILLS: SkillDefinition[] = [];
const DEFAULT_SKILLS_ROOT = "Skills";

export class SkillsRegistry {
  constructor(
    private readonly app: App,
    private readonly skillsRoot: string
  ) {}

  getSkillsRoot(): string {
    return this.skillsRoot;
  }

  async listSkills(skillsRoot = this.skillsRoot): Promise<SkillDefinition[]> {
    const skills = new Map(BUILT_IN_SKILLS.map((skill) => [skill.id, skill]));
    const vaultSkills = await this.loadVaultSkills(skillsRoot);

    for (const skill of vaultSkills) {
      skills.set(skill.id, skill);
    }

    return [...skills.values()].sort((left, right) =>
      left.name.localeCompare(right.name)
    );
  }

  async getSkillById(
    skillId: string,
    skillsRoot = this.skillsRoot
  ): Promise<SkillDefinition | null> {
    const skills = await this.listSkills(skillsRoot);
    return skills.find((skill) => skill.id === skillId) ?? null;
  }

  async listAllowedSkills(
    agent: AgentDefinition,
    skillsRoot = this.skillsRoot
  ): Promise<SkillDefinition[]> {
    const skills = await this.listSkills(skillsRoot);
    return skills.filter((skill) => isAccessAllowed(agent.skills, skill.id));
  }

  private async loadVaultSkills(
    skillsRoot = DEFAULT_SKILLS_ROOT
  ): Promise<SkillDefinition[]> {
    const normalizedRoot = normalizePath(skillsRoot);
    const files = this.app.vault.getMarkdownFiles().filter((file) => {
      if (
        !file.path.startsWith(`${normalizedRoot}/`) ||
        file.name !== "SKILL.md"
      ) {
        return false;
      }

      const relativePath = file.path.slice(normalizedRoot.length + 1);
      return relativePath.split("/").length === 2;
    });

    const parsedSkills = await Promise.all(
      files.map(async (file) => {
        const folderSegments = file.path.split("/");
        const skillId = folderSegments[folderSegments.length - 2];
        if (!skillId) {
          return null;
        }

        const content = await this.app.vault.cachedRead(file);
        try {
          return parseSkillMarkdown(content, skillId, file.path);
        } catch {
          return null;
        }
      })
    );

    return parsedSkills.filter(
      (skill): skill is SkillDefinition => skill !== null
    );
  }
}
