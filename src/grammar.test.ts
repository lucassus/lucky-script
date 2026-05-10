import * as fs from "node:fs";

import * as ohm from "ohm-js";
import { test, expect, describe } from "vitest";

const grammar = ohm.grammar(fs.readFileSync("src/grammar.ohm", "utf-8"));
const semantics = grammar.createSemantics();
const variables = new Map<string, number>();
const functions = new Map<string, { params: string[], body: ohm.Node }>();

class ReturnException extends Error {
  constructor(public value: number) {
    super();
  }
}

semantics.addOperation("eval", {
  Program(exps) {
    let result = 0;
    for (const exp of exps.children) {
      result = exp.eval();
    }
    return result;
  },
  Exp_funDef(_fun, ident, _lparen, params, _rparen, body, _end) {
    const paramNames = params.asIteration().children.map(c => c.sourceString);
    functions.set(ident.sourceString, { params: paramNames, body });
    return 0;
  },
  Exp_return(_return, exp) {
    throw new ReturnException(exp.eval());
  },
  Exp_assign(_let, ident, _eq, exp) {
    const value = exp.eval();
    variables.set(ident.sourceString, value);
    return value;
  },
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
  PriExp_funCall(ident, _lparen, args, _rparen) {
    const name = ident.sourceString;
    if (!functions.has(name)) {
      throw new Error(`Undefined function: ${name}`);
    }
    const fn = functions.get(name)!;
    const argValues = args.asIteration().children.map(c => c.eval());
    
    // Simplistic scope implementation
    const previousValues = new Map<string, number>();
    fn.params.forEach((param, i) => {
      if (variables.has(param)) {
        previousValues.set(param, variables.get(param)!);
      }
      variables.set(param, argValues[i]);
    });
    
    let result = 0;
    try {
      for (const stmt of fn.body.children) {
        result = stmt.eval();
      }
    } catch (e) {
      if (e instanceof ReturnException) {
        result = e.value;
      } else {
        throw e;
      }
    } finally {
      // Restore outer scope variables
      fn.params.forEach(param => {
        if (previousValues.has(param)) {
          variables.set(param, previousValues.get(param)!);
        } else {
          variables.delete(param);
        }
      });
    }
    return result;
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
  PriExp_varAccess(ident) {
    const name = ident.sourceString;
    if (!variables.has(name)) {
      throw new Error(`Undefined variable: ${name}`);
    }
    return variables.get(name)!;
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
      
      expect(evaluate(`
        fun multiply(a, b)
          let product = a * b
          return product
        end
        multiply(3, 4)
      `)).toBe(12);

      // Recursive features not tested due to lack of conditionals, 
      // but functions can be called directly
      expect(evaluate(`
        let foo123bar = 99
        foo123bar + 1
      `)).toBe(100);
      
      // We should also be able to use variables that *start* with keywords!
      expect(evaluate(`
        let letter = 10
        let funny = 5
        letter + funny
      `)).toBe(15);
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
});
