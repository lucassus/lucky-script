import { UndefinedVariableError, ZeroDivisionError } from "./errors";
import { Interpreter, SymbolTable } from "./Interpreter";
import { Parser } from "./Parser";
import { Tokenizer } from "./Tokenizer";

describe("Interpreter", () => {
  it("evaluates", () => {
    const tokens = new Tokenizer("1 + 2 * 3").tokenize();
    const expression = new Parser(tokens).parse();
    const interpreter = new Interpreter(expression);

    expect(interpreter.evaluate()).toBe(7);
  });

  it("evaluates with variables", () => {
    const tokens = new Tokenizer("1 + foo + bar").tokenize();
    const expression = new Parser(tokens).parse();
    const variables: SymbolTable = { foo: 2, bar: 3 };
    const interpreter = new Interpreter(expression, variables);

    expect(interpreter.evaluate()).toBe(6);
  });

  it("raises an error when variable is not defined", () => {
    const tokens = new Tokenizer("1 + foo + bar").tokenize();
    const expression = new Parser(tokens).parse();
    const interpreter = new Interpreter(expression);

    expect(() => interpreter.evaluate()).toThrow(UndefinedVariableError);
    expect(() => interpreter.evaluate()).toThrow("Variable foo is not defined");
  });

  it("raises an error on division by zero", () => {
    const tokens = new Tokenizer("1/0").tokenize();
    const expression = new Parser(tokens).parse();
    const interpreter = new Interpreter(expression);

    expect(() => interpreter.evaluate()).toThrow(ZeroDivisionError);
    expect(() => interpreter.evaluate()).toThrow("Division by zero");
  });
});
