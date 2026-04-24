import { RetrievalService } from "./retrieval-service";

describe("RetrievalService", () => {
  it("ranks relevant notes and excludes configured roots", async () => {
    const app = createApp([
      {
        path: "Notes/Project.md",
        basename: "Project",
        content: "Project plan and roadmap"
      },
      {
        path: "Notes/Random.md",
        basename: "Random",
        content: "Completely unrelated content"
      },
      {
        path: "AI/Conversations/chat.md",
        basename: "chat",
        content: "project discussion"
      }
    ]);
    const service = new RetrievalService(app as never);

    const results = await service.retrieveRelevantNotes({
      query: "project roadmap",
      excludedRoots: ["AI/Conversations"]
    });

    expect(results[0]?.path).toBe("Notes/Project.md");
    expect(results[0]?.snippet).toContain("Project plan and roadmap");
    expect(results.map((result) => result.path)).not.toContain(
      "AI/Conversations/chat.md"
    );
  });

  it("boosts preferred note paths", async () => {
    const app = createApp([
      { path: "Notes/Project.md", basename: "Project", content: "brief note" },
      {
        path: "Notes/Roadmap.md",
        basename: "Roadmap",
        content: "project roadmap details"
      }
    ]);
    const service = new RetrievalService(app as never);

    const results = await service.retrieveRelevantNotes({
      query: "project roadmap",
      preferredPaths: ["Notes/Project.md"]
    });

    expect(results[0]?.path).toBe("Notes/Project.md");
  });
});

function createApp(
  files: Array<{ path: string; basename: string; content: string }>
) {
  const fileMap = new Map(
    files.map((file) => [file.path, { ...file, extension: "md" }])
  );

  return {
    vault: {
      getMarkdownFiles: () => [...fileMap.values()],
      cachedRead: async (file: { path: string }) =>
        fileMap.get(file.path)?.content ?? ""
    }
  };
}
