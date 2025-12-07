import { describe, it, expect } from "vitest";
import { incrementVersion } from "../version";

describe("incrementVersion", () => {
  it("increments patch version correctly", () => {
    expect(incrementVersion("1.2.3")).toBe("1.2.4");
    expect(incrementVersion("0.1.0")).toBe("0.1.1");
    expect(incrementVersion("10.5.99")).toBe("10.5.100");
  });

  it("handles single digit versions", () => {
    expect(incrementVersion("0.0.0")).toBe("0.0.1");
    expect(incrementVersion("1.0.0")).toBe("1.0.1");
  });

  it("handles multi-digit versions", () => {
    expect(incrementVersion("12.34.56")).toBe("12.34.57");
    expect(incrementVersion("100.200.300")).toBe("100.200.301");
  });

  it("returns default version for invalid input", () => {
    expect(incrementVersion("")).toBe("0.1.0");
    expect(incrementVersion("invalid")).toBe("0.1.0");
    expect(incrementVersion("1.2")).toBe("0.1.0");
    expect(incrementVersion("1.2.3.4")).toBe("0.1.0");
  });

  it("returns default version for non-numeric parts", () => {
    expect(incrementVersion("1.2.abc")).toBe("0.1.0");
    expect(incrementVersion("a.b.c")).toBe("0.1.0");
  });
});
