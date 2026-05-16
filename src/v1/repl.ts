import * as readline from "readline";

import { Interpreter } from "./Interpreter";
import { ControlFlow } from "./Interpreter/ControlFlow";
import { SymbolTable } from "./Interpreter/SymbolTable";
import { IllegalSymbolError, Lexer } from "./Lexer";
import { Parser } from "./Parser";

const PROMPT = "> ";

const scanner = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: PROMPT,
});

scanner.prompt();

const symbolTable = new SymbolTable();

scanner.on("line", (line) => {
  const input = line.trim();

  try {
    const lexer = new Lexer(input).tokenize();
    const ast = new Parser(lexer).parse();
    const result = new Interpreter(ast, symbolTable).run();
    console.log(result ?? "nothing");
  } catch (error) {
    if (error instanceof ControlFlow) {
      console.error(
        "Control flow escaped function scope — this is a bug in the interpreter",
      );
      return;
    }

    if (error instanceof IllegalSymbolError) {
      console.log(`${" ".repeat(PROMPT.length + error.position)}^`);
    }

    console.error(error);
  }

  scanner.prompt();
});
