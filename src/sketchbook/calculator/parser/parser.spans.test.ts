import { expect, test } from "vitest";

import type {
  Arithmetic,
  Assign,
  Identifier,
  IfStmt,
  Literal,
  Unary,
} from "./ast";
import { parse } from "./index";

function firstExpr(source: string) {
  const program = parse(source);
  const stmt = program[0];
  if (stmt?.kind !== "ExprStmt") {
    throw new Error(
      `expected first statement to be ExprStmt, got ${stmt?.kind}`,
    );
  }
  return stmt.expr;
}

test("literal span covers the digits and ignores leading whitespace", () => {
  const literal = firstExpr("  42") as Literal;
  expect(literal.kind).toBe("Literal");
  expect(literal.span).toEqual({ start: 2, end: 4 });
});

test("decimal literal span covers integer and fractional parts", () => {
  const literal = firstExpr("3.14") as Literal;
  expect(literal.span).toEqual({ start: 0, end: 4 });
});

test("identifier span covers the whole name", () => {
  const ident = firstExpr("hello") as Identifier;
  expect(ident.kind).toBe("Identifier");
  expect(ident.span).toEqual({ start: 0, end: 5 });
});

test("arithmetic span covers operands and operator; children carry their own spans", () => {
  const arith = firstExpr("1 + 22") as Arithmetic;
  expect(arith.kind).toBe("Arithmetic");
  expect(arith.span).toEqual({ start: 0, end: 6 });
  expect(arith.left.span).toEqual({ start: 0, end: 1 });
  expect(arith.right.span).toEqual({ start: 4, end: 6 });
});

test("parens widen the inner expression's span to include the brackets", () => {
  const literal = firstExpr("(1)") as Literal;
  expect(literal.kind).toBe("Literal");
  expect(literal.span).toEqual({ start: 0, end: 3 });
});

test("unary minus span covers the `-` and its operand", () => {
  const unary = firstExpr("-2") as Unary;
  expect(unary.kind).toBe("Unary");
  expect(unary.op).toBe("-");
  expect(unary.span).toEqual({ start: 0, end: 2 });
  expect(unary.expr.span).toEqual({ start: 1, end: 2 });
});

test("unary plus is collapsed but widens the inner span to include the `+`", () => {
  const literal = firstExpr("+2") as Literal;
  expect(literal.kind).toBe("Literal");
  expect(literal.span).toEqual({ start: 0, end: 2 });
});

test("assignment span covers the target, `=`, and the value", () => {
  const assign = firstExpr("x = 40 + 2") as Assign;
  expect(assign.kind).toBe("Assign");
  expect(assign.span).toEqual({ start: 0, end: 10 });
  expect(assign.value.span).toEqual({ start: 4, end: 10 });
});

test("if statement span covers `if` through `end`", () => {
  const program = parse("if 1\nend");
  const ifStmt = program[0] as IfStmt;
  expect(ifStmt.kind).toBe("IfStmt");
  expect(ifStmt.span).toEqual({ start: 0, end: 8 });
  expect(ifStmt.condition.span).toEqual({ start: 3, end: 4 });
});

test("nested if: inner span is contained in outer span", () => {
  const program = parse("if 1\nif 2\nx = 3\nend\nend");
  const outer = program[0] as IfStmt;
  expect(outer.kind).toBe("IfStmt");
  const inner = outer.consequence[0] as IfStmt;
  expect(inner.kind).toBe("IfStmt");
  expect(inner.span.start).toBeGreaterThan(outer.span.start);
  expect(inner.span.end).toBeLessThan(outer.span.end);
});

test("kitchen sink: full AST snapshot including spans for a multi-feature program", () => {
  const source = `x = 5
y = -x + 3 * 2
z = x == y or not (x > 0)
if z and y >= 0
w = x / 2
end
w`;
  expect(parse(source)).toMatchSnapshot();
});
