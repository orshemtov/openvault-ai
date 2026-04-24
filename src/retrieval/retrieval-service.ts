import { App, TFile } from "obsidian";

const DEFAULT_RETRIEVAL_LIMIT = 5;
const MAX_NOTE_CHARS = 3000;
const MAX_SNIPPET_CHARS = 220;

export interface RetrievedNote {
  path: string;
  score: number;
  content: string;
  snippet: string;
}

export class RetrievalService {
  constructor(private readonly app?: App) {}

  start(): void {
    // Placeholder for indexing and retrieval bootstrap.
  }

  stop(): void {
    // Placeholder for teardown and resource cleanup.
  }

  async retrieveRelevantNotes(options: {
    query: string;
    limit?: number;
    preferredPaths?: string[];
    excludedRoots?: string[];
  }): Promise<RetrievedNote[]> {
    if (!this.app) {
      return [];
    }

    const app = this.app;
    const queryTokens = tokenize(options.query);
    if (queryTokens.length === 0) {
      return [];
    }

    const preferredPathSet = new Set(options.preferredPaths ?? []);
    const excludedRoots = options.excludedRoots ?? [];
    const files = app.vault
      .getMarkdownFiles()
      .filter((file) => isIncludedPath(file.path, excludedRoots));
    const rankedNotes = await Promise.all(
      files.map(async (file) => {
        const content = await app.vault.cachedRead(file);
        const score = scoreNote({
          file,
          content,
          queryTokens,
          isPreferred: preferredPathSet.has(file.path)
        });

        return score > 0
          ? {
              path: file.path,
              score,
              content: content.slice(0, MAX_NOTE_CHARS),
              snippet: createSnippet(content)
            }
          : null;
      })
    );

    return rankedNotes
      .filter((note): note is RetrievedNote => note !== null)
      .sort((left, right) => right.score - left.score)
      .slice(0, options.limit ?? DEFAULT_RETRIEVAL_LIMIT);
  }
}

function scoreNote(options: {
  file: TFile;
  content: string;
  queryTokens: string[];
  isPreferred: boolean;
}): number {
  const lowercasePath = options.file.path.toLowerCase();
  const lowercaseBasename = options.file.basename.toLowerCase();
  const lowercaseContent = options.content.toLowerCase();

  return options.queryTokens.reduce(
    (score, token) => {
      let nextScore = score;

      if (lowercaseBasename.includes(token)) {
        nextScore += 6;
      }

      if (lowercasePath.includes(token)) {
        nextScore += 3;
      }

      if (lowercaseContent.includes(token)) {
        nextScore += 2;
      }

      return nextScore;
    },
    options.isPreferred ? 5 : 0
  );
}

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function isIncludedPath(path: string, excludedRoots: string[]): boolean {
  return !excludedRoots.some(
    (root) => path === root || path.startsWith(`${root}/`)
  );
}

function createSnippet(content: string): string {
  return content.replace(/\s+/g, " ").trim().slice(0, MAX_SNIPPET_CHARS);
}
