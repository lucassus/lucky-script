import { Lexer } from "../../Lexer";
import { Parser } from "../../Parser";
import { Interpreter } from "../Interpreter";

it("sayHello prints a personalised greeting", () => {
  const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

  const script = `
    function sayHello(name) {
      print("Hello, " + name + "!")
    }

    sayHello("World")
  `;

  const tokens = new Lexer(script).tokenize();
  const ast = new Parser(tokens).parse();
  new Interpreter(ast).run();

  expect(consoleSpy).toHaveBeenCalledWith("Hello, World!");

  consoleSpy.mockRestore();
});
