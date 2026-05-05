import { describe, expect, it } from "vitest";

import { LuckyNothing } from "./LuckyNothing";

describe("LuckyNothing.display()", () => {
  it("returns 'nothing'", () => {
    expect(LuckyNothing.Instance.display()).toBe("nothing");
  });
});
