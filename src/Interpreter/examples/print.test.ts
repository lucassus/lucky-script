import { Lexer } from "../../Lexer";
import { Parser } from "../../Parser";
import { Interpreter } from "../Interpreter";
import { RuntimeError } from "../errors";

function run(script: string): undefined | boolean | number | string {
  const tokens = new Lexer(script).tokenize();
  const ast = new Parser(tokens).parse();
  return new Interpreter(ast).run();
}

describe("print builtin", () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("prints a number and returns nothing", () => {
    const result = run("print(42)");
    expect(consoleSpy).toHaveBeenCalledWith("42");
    expect(result).toBeUndefined();
  });

  it("prints true", () => {
    run("print(true)");
    expect(consoleSpy).toHaveBeenCalledWith("true");
  });

  it("prints false", () => {
    run("print(false)");
    expect(consoleSpy).toHaveBeenCalledWith("false");
  });

  it("prints nothing", () => {
    run("print(nothing)");
    expect(consoleSpy).toHaveBeenCalledWith("nothing");
  });

  it("prints a string without surrounding quotes", () => {
    run('print("hello")');
    expect(consoleSpy).toHaveBeenCalledWith("hello");
  });

  it("throws RuntimeError when called with zero arguments", () => {
    expect(() => run("print()")).toThrow(RuntimeError);
  });

  it("throws RuntimeError when called with two arguments", () => {
    expect(() => run("print(1, 2)")).toThrow(RuntimeError);
  });

  it("can be overwritten by user code", () => {
    run(`
      called = 0
      function myPrint(x) {
        called = 1
      }
      print = myPrint
      print(42)
      called
    `);
    expect(consoleSpy).not.toHaveBeenCalled();
  });
});
