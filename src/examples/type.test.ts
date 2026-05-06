import { describe, expect, it } from "vitest";

import { RuntimeError } from "../Interpreter/errors";
import { run } from "../testingUtils";

describe("type builtin", () => {
  it("returns 'number' for a number", () => {
    expect(run("type(42)")).toBe("number");
  });

  it("returns 'string' for a string", () => {
    expect(run('type("hello")')).toBe("string");
  });

  it("returns 'boolean' for true", () => {
    expect(run("type(true)")).toBe("boolean");
  });

  it("returns 'boolean' for false", () => {
    expect(run("type(false)")).toBe("boolean");
  });

  it("returns 'nothing' for nothing", () => {
    expect(run("type(nothing)")).toBe("nothing");
  });

  it("returns 'function' for a user-defined function", () => {
    expect(run("function f() {}\ntype(f)")).toBe("function");
  });

  it("returns 'function' for a builtin function", () => {
    expect(run("type(print)")).toBe("function");
  });

  it("throws RuntimeError when called with zero arguments", () => {
    expect(() => run("type()")).toThrow(RuntimeError);
  });

  it("throws RuntimeError when called with two arguments", () => {
    expect(() => run("type(1, 2)")).toThrow(RuntimeError);
  });
});
