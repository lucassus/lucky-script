import { Lexer } from "./Lexer";
import { AstNode, Parser } from "./Parser";

// TODO: Remove this duplicated method
export function parse(script: string): AstNode {
  const tokens = new Lexer(script).tokenize();
  return new Parser(tokens).parse();
}
