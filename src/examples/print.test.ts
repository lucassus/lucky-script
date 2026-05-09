import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type MockInstance,
  vi,
} from "vitest";

import { RuntimeError } from "../Interpreter/errors";
import { run } from "../testingUtils";

describe("print builtin", () => {
  let consoleSpy: MockInstance;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
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
      fun myPrint(x)
        outer called = 1
      end
      print = myPrint
      print(42)
    `);
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("local print inside a function does not affect print in other functions", () => {
    run(`
      fun usesLocalPrint()
        local print = "shadowed"
      end
      usesLocalPrint()
      print(42)
    `);
    expect(consoleSpy).toHaveBeenCalledWith("42");
  });
});
