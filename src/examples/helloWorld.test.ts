import { expect, it, vi } from "vitest";

import { run } from "../testingUtils";

it("sayHello prints a personalised greeting", () => {
  const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

  run(`
    fun sayHello(name) do
      print("Hello, " + name + "!")
    end

    sayHello("World")
  `);

  expect(consoleSpy).toHaveBeenCalledWith("Hello, World!");

  consoleSpy.mockRestore();
});
