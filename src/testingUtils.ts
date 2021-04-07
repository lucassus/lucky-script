import { Lexer } from "./Lexer";
import { AstNode, Parser } from "./Parser";

export function parse(input: string): AstNode {
  const tokens = new Lexer(input).tokenize();
  return new Parser(tokens).parse();
}
