import { vi } from "vitest";
import { BUILT_IN_AGENTS } from "../agents/built-in-agents";
import { ToolRegistry } from "./tool-registry";
import { ToolRuntime } from "./tool-runtime";
import { TFile } from "obsidian";

vi.mock("obsidian", () => ({
  App: class {},
  MarkdownView: class {},
  TFile: class {},
  normalizePath: (value: string) =>
    value.replace(/\\/g, "/").replace(/\/+/g, "/")
}));

describe("ToolRuntime", () => {
  it("denies blocked tools for the ask agent", async () => {
    const runtime = new ToolRuntime(createApp() as never, new ToolRegistry());

    const result = await runtime.runTool(BUILT_IN_AGENTS[0], {
      toolId: "update-note",
      input: {
        path: "Notes/Test.md",
        content: "Updated"
      }
    });

    expect(result.status).toBe("denied");
    expect(result.message).toContain("blocked by policy");
  });

  it("allows read tools for the ask agent", async () => {
    const runtime = new ToolRuntime(createApp() as never, new ToolRegistry());

    const result = await runtime.runTool(BUILT_IN_AGENTS[0], {
      toolId: "read-note",
      input: {
        path: "Notes/Test.md"
      }
    });

    expect(result.status).toBe("allowed");
    expect(result.output).toContain("Hello world");
  });

  it("returns approval-required for tools that require approval", async () => {
    const registry = new ToolRegistry();
    const originalTool = registry.getToolById("read-note");
    expect(originalTool).not.toBeNull();

    vi.spyOn(registry, "getToolById").mockReturnValue({
      ...originalTool!,
      requiresApproval: true
    });

    const runtime = new ToolRuntime(createApp() as never, registry);
    const result = await runtime.runTool(BUILT_IN_AGENTS[0], {
      toolId: "read-note",
      input: {
        path: "Notes/Test.md"
      }
    });

    expect(result.status).toBe("approval-required");
  });
});

function createApp() {
  const fileMap = new Map([["Notes/Test.md", createFile("Notes/Test.md")]]);
  const contentMap = new Map([["Notes/Test.md", "Hello world"]]);

  return {
    workspace: {
      getActiveViewOfType: () => null
    },
    metadataCache: {
      getFileCache: () => null
    },
    fileManager: {
      processFrontMatter: async () => undefined
    },
    vault: {
      getMarkdownFiles: () => [...fileMap.values()],
      getAbstractFileByPath: (path: string) => fileMap.get(path) ?? null,
      cachedRead: async (file: { path: string }) =>
        contentMap.get(file.path) ?? "",
      create: async (path: string, content: string) => {
        const file = createFile(path);
        fileMap.set(path, file);
        contentMap.set(path, content);
        return file;
      },
      modify: async (file: { path: string }, content: string) => {
        contentMap.set(file.path, content);
      }
    }
  };
}

function createFile(path: string) {
  const file = new TFile();
  Object.assign(file, {
    path,
    basename: path.split("/").pop()?.replace(/\.md$/, "") ?? path,
    extension: "md",
    parent: { path: path.split("/").slice(0, -1).join("/") }
  });
  return file;
}
