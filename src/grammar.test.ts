import { describe, expect, test } from "vitest";

import { evaluate, functions, grammar, variables } from "./grammar";

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
    // Variable assignment
    "let x = 1 + 2",
    "let myVar = 42",
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
    // Variable assignment
    ["let x = 1 + 2", 3],
    ["let myVar = 42", 42],
  ])("evaluates %s to %f", (expr, expected) => {
    expect(evaluate(expr)).toEqual(expected);
  });

  describe("stateful features", () => {
    test("variable assignment and math operations", () => {
      variables.clear(); // Reset state

      expect(evaluate("let base = 10")).toBe(10);
      expect(evaluate("let multiplier = 5")).toBe(5);

      // Basic read
      expect(evaluate("base")).toBe(10);

      // Math with variables
      expect(evaluate("base * multiplier")).toBe(50);
      expect(evaluate("let result = base * multiplier + 2")).toBe(52);

      // More complex math
      expect(evaluate("result / 2")).toBe(26);
      expect(evaluate("(base + 2) ^ 2")).toBe(144);
    });

    test("functions", () => {
      variables.clear();
      functions.clear();

      const script = `
        fun add(a, b)
          return a + b
        end

        fun factorial(n)
          let result = 1
          let current = n
          return current * 2
        end
        
        let x = 10
        add(x, 5)
      `;
      expect(evaluate(script)).toBe(15);

      expect(
        evaluate(`
        fun multiply(a, b)
          let product = a * b
          return product
        end
        multiply(3, 4)
      `),
      ).toBe(12);

      // Recursive features not tested due to lack of conditionals,
      // but functions can be called directly
      expect(
        evaluate(`
        let foo123bar = 99
        foo123bar + 1
      `),
      ).toBe(100);

      // We should also be able to use variables that *start* with keywords!
      expect(
        evaluate(`
        let letter = 10
        let funny = 5
        letter + funny
      `),
      ).toBe(15);
    });

    test("feature-rich multiline script", () => {
      variables.clear(); // Reset state

      const script = `
        let initial = 10.5
        let offset = -2.5
        let factor = 3
        
        let adjusted = initial + offset
        let scaled = adjusted * factor
        
        scaled ^ 2 / 2
      `;

      // initial = 10.5
      // offset = -2.5
      // adjusted = 10.5 + (-2.5) = 8
      // scaled = 8 * 3 = 24
      // final = 24 ^ 2 / 2 = 576 / 2 = 288

      expect(evaluate(script)).toBe(288);

      // We can also assert that intermediate variables were saved properly
      expect(variables.get("adjusted")).toBe(8);
      expect(variables.get("scaled")).toBe(24);
    });
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

  describe("control flow and state", () => {
    test("reassignment", () => {
      variables.clear();
      expect(
        evaluate(`
        let x = 10
        x = x + 5
        x
      `),
      ).toBe(15);
    });

    test("comparisons and logical operators", () => {
      variables.clear();
      expect(evaluate("10 == 10")).toBe(1);
      expect(evaluate("10 == 5")).toBe(0);
      expect(evaluate("10 != 5")).toBe(1);
      expect(evaluate("10 != 10")).toBe(0);
      expect(evaluate("5 < 10")).toBe(1);
      expect(evaluate("10 < 5")).toBe(0);
      expect(evaluate("15 > 10")).toBe(1);
      expect(evaluate("10 > 15")).toBe(0);
      expect(evaluate("10 <= 10")).toBe(1);
      expect(evaluate("5 <= 10")).toBe(1);
      expect(evaluate("15 <= 10")).toBe(0);
      expect(evaluate("10 >= 10")).toBe(1);
      expect(evaluate("15 >= 10")).toBe(1);
      expect(evaluate("5 >= 10")).toBe(0);
      expect(evaluate("true == 1")).toBe(1);
      expect(evaluate("false == 0")).toBe(1);

      // Logical operators
      expect(evaluate("true and true")).toBe(1);
      expect(evaluate("true and false")).toBe(0);
      expect(evaluate("false and true")).toBe(0);
      expect(evaluate("false and false")).toBe(0);

      expect(evaluate("true or false")).toBe(1);
      expect(evaluate("false or true")).toBe(1);
      expect(evaluate("false or false")).toBe(0);
      expect(evaluate("true or true")).toBe(1);

      // not
      expect(evaluate("not true")).toBe(0);
      expect(evaluate("not false")).toBe(1);
      expect(evaluate("not (10 > 5)")).toBe(0);
      expect(evaluate("not (5 > 10)")).toBe(1);

      // complex logic (brackets were naturally supported because PriExp allows `(Exp)`)
      expect(evaluate("10 > 5 and 5 < 10")).toBe(1);
      expect(evaluate("10 > 5 and 5 > 10")).toBe(0);
      expect(evaluate("10 > 5 or 5 > 10")).toBe(1);

      // Brackets with and/or
      expect(evaluate("false and (true or true)")).toBe(0);
      expect(evaluate("(false and true) or true")).toBe(1);
      expect(evaluate("true and (false or true)")).toBe(1);
    });

    test("modulo operator", () => {
      expect(evaluate("10 % 3")).toBe(1);
      expect(evaluate("15 % 5")).toBe(0);
      expect(evaluate("10 % 3 + 2")).toBe(3); // Modulo should have same precedence as Mul/Div
      expect(evaluate("10 % (2 + 1)")).toBe(1);
    });

    test("if/else", () => {
      variables.clear();
      expect(
        evaluate(`
        let a = 10
        if a > 5 then
          a = a * 2
        else
          a = a / 2
        end
        a
      `),
      ).toBe(20);

      expect(
        evaluate(`
        let b = 2
        if b > 5 then
          b = b * 2
        else
          b = b / 2
        end
        b
      `),
      ).toBe(1);
    });

    test("comments", () => {
      variables.clear();
      expect(
        evaluate(`
        // This is a comment
        let x = 10 // inline comment
        // another comment
        x = x * 2
        x
      `),
      ).toBe(20);
    });
  });
});
