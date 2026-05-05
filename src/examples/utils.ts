import { Lexer } from "../Lexer";
import { Parser } from "../Parser";
import { Interpreter } from "../Interpreter";

export function run(script: string): undefined | boolean | number | string {
  const tokens = new Lexer(script).tokenize();
  const ast = new Parser(tokens).parse();
  return new Interpreter(ast).run();
}
