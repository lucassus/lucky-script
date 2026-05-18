import { describe, expect, test } from "vitest";

import { Environment } from "./Environment";
import { UndefinedVariable } from "./errors";
import type { Value } from "./value";

const num = (value: number): Value => ({ kind: "number", value });

describe("Environment", () => {
  test("define creates and get reads a binding in current scope", () => {
    const env = new Environment();
    env.define("x", num(7));

    expect(env.get("x")).toEqual(num(7));
  });

  test("define overwrites an existing binding in current scope", () => {
    const env = new Environment();
    env.define("x", num(1));
    env.define("x", num(2));

    expect(env.get("x")).toEqual(num(2));
  });

  test("get walks the enclosing chain", () => {
    const globalEnv = new Environment();
    globalEnv.define("x", num(10));
    const localEnv = new Environment(globalEnv);

    expect(localEnv.get("x")).toEqual(num(10));
  });

  test("get prefers nearest binding when names are shadowed", () => {
    const globalEnv = new Environment();
    globalEnv.define("x", num(10));
    const localEnv = new Environment(globalEnv);
    localEnv.define("x", num(99));

    expect(localEnv.get("x")).toEqual(num(99));
    expect(globalEnv.get("x")).toEqual(num(10));
  });

  test("get throws UndefinedVariable when name is missing", () => {
    const env = new Environment();

    expect(() => env.get("missing")).toThrow(UndefinedVariable);
  });

  test("assign updates a binding in current scope", () => {
    const env = new Environment();
    env.define("x", num(1));

    env.assign("x", num(42));

    expect(env.get("x")).toEqual(num(42));
  });

  test("assign updates nearest existing binding in enclosing chain", () => {
    const globalEnv = new Environment();
    globalEnv.define("x", num(1));
    const midEnv = new Environment(globalEnv);
    midEnv.define("x", num(2));
    const localEnv = new Environment(midEnv);

    localEnv.assign("x", num(3));

    expect(localEnv.get("x")).toEqual(num(3));
    expect(midEnv.get("x")).toEqual(num(3));
    expect(globalEnv.get("x")).toEqual(num(1));
  });

  test("assign throws UndefinedVariable when name is missing in all scopes", () => {
    const globalEnv = new Environment();
    const localEnv = new Environment(globalEnv);

    expect(() => localEnv.assign("missing", num(1))).toThrow(UndefinedVariable);
  });
});
