import { describe, expect, it } from "vitest";

import { jsonGrammar } from "./json";

describe("JsonMini Ohm grammar", () => {
  it.each([
    '"hello"',
    "42",
    "-3.14",
    "true",
    "false",
    "null",
    "[]",
    "{}",
    "[1,2,3]",
    '{"a":1,"b":[true,null]}',
    String.raw`{"k":"a\"b"}`,
  ])("accepts %s", (src) => {
    expect(jsonGrammar.match(src).succeeded()).toBe(true);
  });

  it.each(["[1,2,]", '{"a" 1}', "{a:1}", "'hi'"])("rejects %s", (src) => {
    expect(jsonGrammar.match(src).failed()).toBe(true);
  });

  it("accepts a kitchen-sink document (nested objects/arrays, exponents)", () => {
    const src = `
{
  "meta": {
    "version": 2,
    "tags": ["alpha", "beta", "gamma"],
    "matrix": [[1, 0.0], [-2.5e-1, 3.14E+2]]
  },
  "items": [
    {
      "id": "a",
      "flags": [true, false, null],
      "z": 0,
      "pair": {"left": 1, "right": 2}
    },
    {
      "id": "b",
      "nested": {"deep": {"n": 7, "path": ["x", "y", "z"]}},
      "empty": {}
    }
  ],
  "tail": []
}
    `.trim();

    expect(jsonGrammar.match(src).succeeded()).toBe(true);
  });
});
