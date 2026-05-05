import { Interpreter } from "../Interpreter";
import { Lexer } from "../Lexer";
import { Parser } from "../Parser";

export function run(script: string): undefined | boolean | number | string {
  const tokens = new Lexer(script).tokenize();
  const ast = new Parser(tokens).parse();
  return new Interpreter(ast).run();
}
