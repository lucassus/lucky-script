import { charRange } from "./charRange";

describe(".charRange", () => {
  it("generates an array of characters for the given range", () => {
    expect(charRange("0", "3")).toEqual(["0", "1", "2", "3"]);
    expect(charRange("a", "c")).toEqual(["a", "b", "c"]);
  });
});
