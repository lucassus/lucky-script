import { expect, it, vi } from "vitest";

import { run } from "../testingUtils";

it("sayHello prints a personalised greeting", () => {
  const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

  run(`
    function sayHello(name) {
      print("Hello, " + name + "!")
    }

    sayHello("World")
  `);

  expect(consoleSpy).toHaveBeenCalledWith("Hello, World!");

  consoleSpy.mockRestore();
});
