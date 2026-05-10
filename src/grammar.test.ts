import * as fs from "node:fs";

import * as ohm from "ohm-js";
import { test, expect, describe } from "vitest";

const grammar = ohm.grammar(fs.readFileSync("src/grammar.ohm", "utf-8"));
const semantics = grammar.createSemantics();
semantics.addOperation("eval", {
  AddExp_plus(a, _, b) {
    return a.eval() + b.eval();
  },
  AddExp_minus(a, _, b) {
    return a.eval() - b.eval();
  },
  MulExp_times(a, _, b) {
    return a.eval() * b.eval();
  },
  MulExp_divide(a, _, b) {
    return a.eval() / b.eval();
  },
  PowExp_pow(a, _, b) {
    return a.eval() ** b.eval();
  },
  PriExp_paren(_l, e, _r) {
    return e.eval();
  },
  PriExp_pos(_, e) {
    return e.eval();
  },
  PriExp_neg(_, e) {
    return -e.eval();
  },
  number(digits) {
    return parseFloat(digits.sourceString);
  },
});

function evaluate(expr: string): number {
  const matchResult = grammar.match(expr);
  if (!matchResult.succeeded()) {
    throw new Error(`Parse failed for: ${expr}`);
  }
  return semantics(matchResult).eval();
}

describe("grammar", () => {
  test.each([
    // Numbers
    "42",
    "1",
    // Basic operations
    "1 + 2",
    "5 - 3",
    "4 * 2",
    "10 / 2",
    // Complex expressions
    "1 + 2 * 3",
    "99 - 2 + 1",
    "(99 - 2) / 2",
    "(1 + 2) * 2",
    // Left associativity
    "10 - 2 - 3",
    "100 / 10 / 2",
  ])("matches %s", (expr) => {
    expect(grammar.match(expr).succeeded()).toBe(true);
  });

  test.each([
    // Numbers
    ["42", 42],
    ["1", 1],
    // Basic operations
    ["1 + 2", 3],
    ["5 - 3", 2],
    ["4 * 2", 8],
    ["10 / 2", 5],
    // Order of operations
    ["1 + 2 * 3", 7],
    ["2 * 3 + 1", 7],
    // Parentheses grouping
    ["(1 + 2) * 2", 6],
    ["(99 - 2) / 2", 48.5],
    // Left associativity
    ["10 - 2 - 3", 5],
    ["100 / 10 / 2", 5],
  ])("evaluates %s to %f", (expr, expected) => {
    expect(evaluate(expr)).toEqual(expected);
  });

  describe("currently unsupported features", () => {
    test.each([
      // Signed numbers
      "-2",
      "+123",
      // Fractional numbers
      "0.5",
      "1.99",
      "-1.5 + 2",
      // Unary operators before parentheses
      "-(1+2)",
      "+(1+2)",
      // Power operator
      "2 ^ 3",
      "(2 + 1) ^ 2",
      "2 ^ (1 + 2)",
      "(-2) ^ 3",
      "-2 ^ 2",
      "2 ^ 3 ^ 2",
    ])("matches %s", (expr) => {
      expect(grammar.match(expr).succeeded()).toBe(true);
    });

    test.each([
      // Signed numbers
      ["-2", -2],
      ["+123", 123],
      // Fractional numbers
      ["0.5", 0.5],
      ["1.99", 1.99],
      ["-1.5 + 2", 0.5],
      // Unary operators before parentheses
      ["-(1+2)", -3],
      ["+(1+2)", 3],
      // Power operator
      ["2 ^ 3", 8],
      ["(2 + 1) ^ 2", 9],
      ["2 ^ (1 + 2)", 8],
      ["(-2) ^ 3", -8],
      ["-2 ^ 2", 4],
      ["2 ^ 3 ^ 2", 512],
    ])("evaluates %s to %f", (expr, expected) => {
      expect(evaluate(expr)).toEqual(expected);
    });
  });
});
