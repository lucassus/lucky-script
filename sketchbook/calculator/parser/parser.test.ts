import { expect, test } from "vitest";

import { parse } from ".";

test("precedence: addition below multiplication", () => {
  expect(parse("1 + 2 * 3")).toEqual([
    {
      kind: "ExprStmt",
      expr: {
        kind: "Arithmetic",
        op: "+",
        left: { kind: "Literal", value: 1 },
        right: {
          kind: "Arithmetic",
          op: "*",
          left: { kind: "Literal", value: 2 },
          right: { kind: "Literal", value: 3 },
        },
      },
    },
  ]);
});

test("parentheses shape (not a ParenExpr; grouping via tree)", () => {
  expect(parse("(1 + 2) * 3")).toEqual([
    {
      kind: "ExprStmt",
      expr: {
        kind: "Arithmetic",
        op: "*",
        left: {
          kind: "Arithmetic",
          op: "+",
          left: { kind: "Literal", value: 1 },
          right: { kind: "Literal", value: 2 },
        },
        right: { kind: "Literal", value: 3 },
      },
    },
  ]);
});

test("unary minus, normalized unary plus, and chained unary minus", () => {
  expect(parse("-2")).toEqual([
    {
      kind: "ExprStmt",
      expr: {
        kind: "Unary",
        op: "-",
        expr: { kind: "Literal", value: 2 },
      },
    },
  ]);

  expect(parse("+2")).toEqual([
    { kind: "ExprStmt", expr: { kind: "Literal", value: 2 } },
  ]);

  expect(parse("-(-1)")).toEqual([
    {
      kind: "ExprStmt",
      expr: {
        kind: "Unary",
        op: "-",
        expr: {
          kind: "Unary",
          op: "-",
          expr: { kind: "Literal", value: 1 },
        },
      },
    },
  ]);
});

test("subtraction is left-associative", () => {
  expect(parse("10 - 3 - 2")).toEqual([
    {
      kind: "ExprStmt",
      expr: {
        kind: "Arithmetic",
        op: "-",
        left: {
          kind: "Arithmetic",
          op: "-",
          left: { kind: "Literal", value: 10 },
          right: { kind: "Literal", value: 3 },
        },
        right: { kind: "Literal", value: 2 },
      },
    },
  ]);
});

test("division is left-associative", () => {
  expect(parse("8 / 4 / 2")).toEqual([
    {
      kind: "ExprStmt",
      expr: {
        kind: "Arithmetic",
        op: "/",
        left: {
          kind: "Arithmetic",
          op: "/",
          left: { kind: "Literal", value: 8 },
          right: { kind: "Literal", value: 4 },
        },
        right: { kind: "Literal", value: 2 },
      },
    },
  ]);
});

test("decimal numerals", () => {
  expect(parse("3.14 + 2")).toEqual([
    {
      kind: "ExprStmt",
      expr: {
        kind: "Arithmetic",
        op: "+",
        left: { kind: "Literal", value: 3.14 },
        right: { kind: "Literal", value: 2 },
      },
    },
  ]);
});

test("empty program", () => {
  expect(parse("")).toEqual([]);
  expect(parse("\n\n")).toEqual([]);
});

test("multiple statements", () => {
  expect(parse("1+2\n3+4")).toEqual([
    {
      kind: "ExprStmt",
      expr: {
        kind: "Arithmetic",
        op: "+",
        left: { kind: "Literal", value: 1 },
        right: { kind: "Literal", value: 2 },
      },
    },
    {
      kind: "ExprStmt",
      expr: {
        kind: "Arithmetic",
        op: "+",
        left: { kind: "Literal", value: 3 },
        right: { kind: "Literal", value: 4 },
      },
    },
  ]);
});

test("assignment to identifier", () => {
  expect(parse("x = 40 + 2\nx")).toEqual([
    {
      kind: "ExprStmt",
      expr: {
        kind: "Assign",
        name: "x",
        value: {
          kind: "Arithmetic",
          op: "+",
          left: { kind: "Literal", value: 40 },
          right: { kind: "Literal", value: 2 },
        },
      },
    },
    { kind: "ExprStmt", expr: { kind: "Variable", name: "x" } },
  ]);
});

test("chained assignment is right-associative", () => {
  expect(parse("x = y = 1")).toEqual([
    {
      kind: "ExprStmt",
      expr: {
        kind: "Assign",
        name: "x",
        value: {
          kind: "Assign",
          name: "y",
          value: { kind: "Literal", value: 1 },
        },
      },
    },
  ]);
});

test.each<[string, ">" | "<" | ">=" | "<=" | "==" | "!="]>([
  ["3 > 2", ">"],
  ["3 < 2", "<"],
  ["3 >= 2", ">="],
  ["3 <= 2", "<="],
  ["3 == 2", "=="],
  ["3 != 2", "!="],
])("comparison operator %s parses to Compare", (source, op) => {
  expect(parse(source)).toEqual([
    {
      kind: "ExprStmt",
      expr: {
        kind: "Compare",
        op,
        left: { kind: "Literal", value: 3 },
        right: { kind: "Literal", value: 2 },
      },
    },
  ]);
});

test("comparison is lower precedence than arithmetic", () => {
  expect(parse("x + 1 > y * 2")).toEqual([
    {
      kind: "ExprStmt",
      expr: {
        kind: "Compare",
        op: ">",
        left: {
          kind: "Arithmetic",
          op: "+",
          left: { kind: "Variable", name: "x" },
          right: { kind: "Literal", value: 1 },
        },
        right: {
          kind: "Arithmetic",
          op: "*",
          left: { kind: "Variable", name: "y" },
          right: { kind: "Literal", value: 2 },
        },
      },
    },
  ]);
});

test("logical or parses to Logical", () => {
  expect(parse("a or b")).toEqual([
    {
      kind: "ExprStmt",
      expr: {
        kind: "Logical",
        op: "or",
        left: { kind: "Variable", name: "a" },
        right: { kind: "Variable", name: "b" },
      },
    },
  ]);
});

test("logical and parses to Logical", () => {
  expect(parse("a and b")).toEqual([
    {
      kind: "ExprStmt",
      expr: {
        kind: "Logical",
        op: "and",
        left: { kind: "Variable", name: "a" },
        right: { kind: "Variable", name: "b" },
      },
    },
  ]);
});

test("not parses to Unary with op not", () => {
  expect(parse("not a")).toEqual([
    {
      kind: "ExprStmt",
      expr: {
        kind: "Unary",
        op: "not",
        expr: { kind: "Variable", name: "a" },
      },
    },
  ]);
});

test("and binds tighter than or", () => {
  expect(parse("a or b and c")).toEqual([
    {
      kind: "ExprStmt",
      expr: {
        kind: "Logical",
        op: "or",
        left: { kind: "Variable", name: "a" },
        right: {
          kind: "Logical",
          op: "and",
          left: { kind: "Variable", name: "b" },
          right: { kind: "Variable", name: "c" },
        },
      },
    },
  ]);
});

test("not binds tighter than and", () => {
  expect(parse("not a and b")).toEqual([
    {
      kind: "ExprStmt",
      expr: {
        kind: "Logical",
        op: "and",
        left: {
          kind: "Unary",
          op: "not",
          expr: { kind: "Variable", name: "a" },
        },
        right: { kind: "Variable", name: "b" },
      },
    },
  ]);
});

test("parentheses override logical precedence", () => {
  expect(parse("a and (b or c)")).toEqual([
    {
      kind: "ExprStmt",
      expr: {
        kind: "Logical",
        op: "and",
        left: { kind: "Variable", name: "a" },
        right: {
          kind: "Logical",
          op: "or",
          left: { kind: "Variable", name: "b" },
          right: { kind: "Variable", name: "c" },
        },
      },
    },
  ]);
});

test("comparison is tighter than logical", () => {
  expect(parse("x > 1 and y < 2")).toEqual([
    {
      kind: "ExprStmt",
      expr: {
        kind: "Logical",
        op: "and",
        left: {
          kind: "Compare",
          op: ">",
          left: { kind: "Variable", name: "x" },
          right: { kind: "Literal", value: 1 },
        },
        right: {
          kind: "Compare",
          op: "<",
          left: { kind: "Variable", name: "y" },
          right: { kind: "Literal", value: 2 },
        },
      },
    },
  ]);
});

test("and/or/not cannot be used as variable names", () => {
  expect(() => parse("and = 1")).toThrow();
  expect(() => parse("or = 1")).toThrow();
  expect(() => parse("not = 1")).toThrow();
});

test("andersn/order/notable are valid identifiers (not keywords)", () => {
  expect(() => parse("andersn = 1")).not.toThrow();
  expect(() => parse("order = 1")).not.toThrow();
  expect(() => parse("notable = 1")).not.toThrow();
});

test("assignment rhs can contain a comparison", () => {
  expect(parse("a = x == 1")).toEqual([
    {
      kind: "ExprStmt",
      expr: {
        kind: "Assign",
        name: "a",
        value: {
          kind: "Compare",
          op: "==",
          left: { kind: "Variable", name: "x" },
          right: { kind: "Literal", value: 1 },
        },
      },
    },
  ]);
});

test("if end: empty body", () => {
  expect(parse("if 1 > 0\nend")).toEqual([
    {
      kind: "IfStmt",
      condition: {
        kind: "Compare",
        op: ">",
        left: { kind: "Literal", value: 1 },
        right: { kind: "Literal", value: 0 },
      },
      body: [],
    },
  ]);
});

test("if end: body with assignment", () => {
  expect(parse("if 1 > 0\nx = 2\nend")).toEqual([
    {
      kind: "IfStmt",
      condition: {
        kind: "Compare",
        op: ">",
        left: { kind: "Literal", value: 1 },
        right: { kind: "Literal", value: 0 },
      },
      body: [
        {
          kind: "ExprStmt",
          expr: {
            kind: "Assign",
            name: "x",
            value: { kind: "Literal", value: 2 },
          },
        },
      ],
    },
  ]);
});

test("nested if", () => {
  expect(parse("if 1 > 0\nif 2 > 1\nx = 1\nend\nend")).toEqual([
    {
      kind: "IfStmt",
      condition: {
        kind: "Compare",
        op: ">",
        left: { kind: "Literal", value: 1 },
        right: { kind: "Literal", value: 0 },
      },
      body: [
        {
          kind: "IfStmt",
          condition: {
            kind: "Compare",
            op: ">",
            left: { kind: "Literal", value: 2 },
            right: { kind: "Literal", value: 1 },
          },
          body: [
            {
              kind: "ExprStmt",
              expr: {
                kind: "Assign",
                name: "x",
                value: { kind: "Literal", value: 1 },
              },
            },
          ],
        },
      ],
    },
  ]);
});

test("if after condition must start on a new line", () => {
  expect(() => parse("if 1 > 0 x = 1 end")).toThrow();
});

test("if and end are not identifiers", () => {
  expect(() => parse("if = 1")).toThrow();
  expect(() => parse("end = 1")).toThrow();
});

test("if is not valid on rhs of assignment", () => {
  expect(() => parse("x = if 1 > 0\nend")).toThrow();
});
