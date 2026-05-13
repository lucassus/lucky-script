import { test, expect } from "vitest";

import { parse } from "./parser";

test("calculator", () => {
  const ast = parse("(1 + 2) * 3");
  expect(ast).toBeDefined();
});
