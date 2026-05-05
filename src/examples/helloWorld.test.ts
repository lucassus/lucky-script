import { run } from "./utils";

it("sayHello prints a personalised greeting", () => {
  const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

  run(`
    function sayHello(name) {
      print("Hello, " + name + "!")
    }

    sayHello("World")
  `);

  expect(consoleSpy).toHaveBeenCalledWith("Hello, World!");

  consoleSpy.mockRestore();
});
