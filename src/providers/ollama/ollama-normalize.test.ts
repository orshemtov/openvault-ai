import { normalizeOllamaModel } from "./ollama-normalize";

describe("normalizeOllamaModel", () => {
  it("marks local models and infers edit support for common chat families", () => {
    const model = normalizeOllamaModel({
      model: "llama3.1:8b",
      name: "llama3.1:8b"
    });

    expect(model.isLocal).toBe(true);
    expect(model.supportsEmbeddings).toBe(false);
    expect(model.recommendedUses).toContain("edit");
  });

  it("recognizes embedding models", () => {
    const model = normalizeOllamaModel({
      model: "mxbai-embed-large:latest"
    });

    expect(model.supportsEmbeddings).toBe(true);
    expect(model.recommendedUses).toContain("embeddings");
  });
});
