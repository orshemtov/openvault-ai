export type SkillSource = "built-in" | "vault";

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  prompt: string;
  source: SkillSource;
  path?: string;
}
