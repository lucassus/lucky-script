import * as readline from "readline";

import { SyntaxError } from "./errors";
import { SymbolTable, Interpreter } from "./Interpreter";
import { Parser } from "./Parser";
import { Tokenizer } from "./Tokenizer";

const PROMPT = "> ";

const scanner = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: PROMPT,
});

scanner.prompt();

const symbolTable: SymbolTable = {
  one: 1,
  two: 2,
  three: 3,
};

scanner.on("line", (line) => {
  const input = line.trim();

  try {
    const lexer = new Tokenizer(input).tokenize();
    const ast = new Parser(lexer).parse();
    const result = new Interpreter(ast, symbolTable).evaluate();
    console.log(result);
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error("^".padStart(PROMPT.length + error.position + 1, " "));
    }
    console.error(error.message);
  }

  scanner.prompt();
});
