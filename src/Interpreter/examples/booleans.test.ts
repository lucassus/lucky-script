import { Lexer } from "../../Lexer";
import { Parser } from "../../Parser";
import { Interpreter } from "../Interpreter";

function run(script: string): undefined | boolean | number {
  const tokens = new Lexer(script).tokenize();
  const ast = new Parser(tokens).parse();
  return new Interpreter(ast).run();
}

describe("Boolean literals", () => {
  it.each`
    script     | expected
    ${"true"}  | ${true}
    ${"false"} | ${false}
  `("evaluates $script to $expected", ({ script, expected }) => {
    expect(run(script)).toBe(expected);
  });
});
