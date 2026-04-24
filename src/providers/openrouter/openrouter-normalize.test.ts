import { normalizeOpenRouterModel } from "./openrouter-normalize";

describe("normalizeOpenRouterModel", () => {
  it("marks tool and structured output support from supported parameters", () => {
    const model = normalizeOpenRouterModel({
      id: "openai/gpt-5.4",
      name: "GPT-5.4",
      context_length: 200000,
      supported_parameters: ["tools", "response_format"]
    });

    expect(model.supportsToolCalling).toBe(true);
    expect(model.supportsStructuredOutput).toBe(true);
    expect(model.contextWindow).toBe(200000);
    expect(model.recommendedUses).toContain("edit");
  });

  it("recognizes embedding-oriented models", () => {
    const model = normalizeOpenRouterModel({
      id: "openai/text-embedding-3-large"
    });

    expect(model.supportsEmbeddings).toBe(true);
    expect(model.recommendedUses).toContain("embeddings");
  });
});
