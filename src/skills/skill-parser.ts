import matter from "gray-matter";
import { z } from "zod";
import type { SkillDefinition } from "./skill-types";

const skillFrontmatterSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1)
});

export function parseSkillMarkdown(
  fileContent: string,
  skillId: string,
  path?: string
): SkillDefinition {
  const parsed = matter(fileContent);
  const frontmatter = skillFrontmatterSchema.parse(parsed.data);

  return {
    id: skillId,
    name: frontmatter.name,
    description: frontmatter.description,
    prompt: parsed.content.trim(),
    source: "vault",
    path
  };
}
