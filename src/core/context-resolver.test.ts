import { truncateSelection } from "./context-utils";

describe("truncateSelection", () => {
  it("returns the original text when shorter than the limit", () => {
    expect(truncateSelection("hello", 10)).toBe("hello");
  });

  it("truncates long selections with ellipsis", () => {
    expect(truncateSelection("abcdefghijklmnopqrstuvwxyz", 10)).toBe(
      "abcdefg..."
    );
  });
});
