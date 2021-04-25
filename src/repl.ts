import * as readline from "readline";

import { Interpreter } from "./Interpreter";
import { LuckyObject } from "./Interpreter/LuckyObject";
import { Lexer, SyntaxError } from "./Lexer";
import { Parser, printAst } from "./Parser";

const PROMPT = "> ";

const scanner = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: PROMPT,
});

scanner.prompt();

const symbolTable = new Map<string, LuckyObject>();

scanner.on("line", (line) => {
  const input = line.trim();

  try {
    const lexer = new Lexer(input).tokenize();

    const ast = new Parser(lexer).parse();
    console.log("\nAbstract Syntax Tree:");
    console.log(printAst(ast));

    const result = new Interpreter(ast, symbolTable).run();
    console.log(result);
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.log(`${" ".repeat(PROMPT.length + error.position)}^`);
    }

    console.error(error);
  }

  scanner.prompt();
});
