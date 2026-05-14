import { expect, test } from "vitest";

import {
  AssignExpr,
  BinaryExpr,
  CompareExpr,
  ExprStmt,
  Identifier,
  LogicalExpr,
  NotExpr,
  NumberLiteral,
  Program,
  UnaryExpr,
} from "./ast";
import { parse } from "./parser";

test("precedence: addition below multiplication", () => {
  expect(parse("1 + 2 * 3")).toEqual(
    new Program([
      new ExprStmt(
        new BinaryExpr(
          "+",
          new NumberLiteral(1),
          new BinaryExpr("*", new NumberLiteral(2), new NumberLiteral(3)),
        ),
      ),
    ]),
  );
});

test("parentheses shape (not a ParenExpr; grouping via tree)", () => {
  expect(parse("(1 + 2) * 3")).toEqual(
    new Program([
      new ExprStmt(
        new BinaryExpr(
          "*",
          new BinaryExpr("+", new NumberLiteral(1), new NumberLiteral(2)),
          new NumberLiteral(3),
        ),
      ),
    ]),
  );
});

test("unary minus, normalized unary plus, and chained unary minus", () => {
  expect(parse("-2")).toEqual(
    new Program([new ExprStmt(new UnaryExpr(new NumberLiteral(2)))]),
  );

  expect(parse("+2")).toEqual(
    new Program([new ExprStmt(new NumberLiteral(2))]),
  );

  expect(parse("-(-1)")).toEqual(
    new Program([
      new ExprStmt(new UnaryExpr(new UnaryExpr(new NumberLiteral(1)))),
    ]),
  );
});

test("subtraction is left-associative", () => {
  expect(parse("10 - 3 - 2")).toEqual(
    new Program([
      new ExprStmt(
        new BinaryExpr(
          "-",
          new BinaryExpr("-", new NumberLiteral(10), new NumberLiteral(3)),
          new NumberLiteral(2),
        ),
      ),
    ]),
  );
});

test("division is left-associative", () => {
  expect(parse("8 / 4 / 2")).toEqual(
    new Program([
      new ExprStmt(
        new BinaryExpr(
          "/",
          new BinaryExpr("/", new NumberLiteral(8), new NumberLiteral(4)),
          new NumberLiteral(2),
        ),
      ),
    ]),
  );
});

test("decimal numerals", () => {
  expect(parse("3.14 + 2")).toEqual(
    new Program([
      new ExprStmt(
        new BinaryExpr("+", new NumberLiteral(3.14), new NumberLiteral(2)),
      ),
    ]),
  );
});

test("multiple statements", () => {
  expect(parse("1+2\n3+4")).toEqual(
    new Program([
      new ExprStmt(
        new BinaryExpr("+", new NumberLiteral(1), new NumberLiteral(2)),
      ),
      new ExprStmt(
        new BinaryExpr("+", new NumberLiteral(3), new NumberLiteral(4)),
      ),
    ]),
  );
});

test("assignment to identifier", () => {
  expect(parse("x = 40 + 2\nx")).toEqual(
    new Program([
      new ExprStmt(
        new AssignExpr(
          "x",
          new BinaryExpr("+", new NumberLiteral(40), new NumberLiteral(2)),
        ),
      ),
      new ExprStmt(new Identifier("x")),
    ]),
  );
});

test("chained assignment is right-associative", () => {
  expect(parse("x = y = 1")).toEqual(
    new Program([
      new ExprStmt(
        new AssignExpr("x", new AssignExpr("y", new NumberLiteral(1))),
      ),
    ]),
  );
});

test.each<[string, ">" | "<" | ">=" | "<=" | "==" | "!="]>([
  ["3 > 2", ">"],
  ["3 < 2", "<"],
  ["3 >= 2", ">="],
  ["3 <= 2", "<="],
  ["3 == 2", "=="],
  ["3 != 2", "!="],
])("comparison operator %s parses to CompareExpr", (source, op) => {
  expect(parse(source)).toEqual(
    new Program([
      new ExprStmt(
        new CompareExpr(op, new NumberLiteral(3), new NumberLiteral(2)),
      ),
    ]),
  );
});

test("comparison is lower precedence than arithmetic", () => {
  expect(parse("x + 1 > y * 2")).toEqual(
    new Program([
      new ExprStmt(
        new CompareExpr(
          ">",
          new BinaryExpr("+", new Identifier("x"), new NumberLiteral(1)),
          new BinaryExpr("*", new Identifier("y"), new NumberLiteral(2)),
        ),
      ),
    ]),
  );
});

test("logical or parses to LogicalExpr", () => {
  expect(parse("a or b")).toEqual(
    new Program([
      new ExprStmt(
        new LogicalExpr("or", new Identifier("a"), new Identifier("b")),
      ),
    ]),
  );
});

test("logical and parses to LogicalExpr", () => {
  expect(parse("a and b")).toEqual(
    new Program([
      new ExprStmt(
        new LogicalExpr("and", new Identifier("a"), new Identifier("b")),
      ),
    ]),
  );
});

test("not parses to NotExpr", () => {
  expect(parse("not a")).toEqual(
    new Program([new ExprStmt(new NotExpr(new Identifier("a")))]),
  );
});

test("and binds tighter than or", () => {
  expect(parse("a or b and c")).toEqual(
    new Program([
      new ExprStmt(
        new LogicalExpr(
          "or",
          new Identifier("a"),
          new LogicalExpr("and", new Identifier("b"), new Identifier("c")),
        ),
      ),
    ]),
  );
});

test("not binds tighter than and", () => {
  expect(parse("not a and b")).toEqual(
    new Program([
      new ExprStmt(
        new LogicalExpr("and", new NotExpr(new Identifier("a")), new Identifier("b")),
      ),
    ]),
  );
});

test("parentheses override logical precedence", () => {
  expect(parse("a and (b or c)")).toEqual(
    new Program([
      new ExprStmt(
        new LogicalExpr(
          "and",
          new Identifier("a"),
          new LogicalExpr("or", new Identifier("b"), new Identifier("c")),
        ),
      ),
    ]),
  );
});

test("comparison is tighter than logical", () => {
  expect(parse("x > 1 and y < 2")).toEqual(
    new Program([
      new ExprStmt(
        new LogicalExpr(
          "and",
          new CompareExpr(">", new Identifier("x"), new NumberLiteral(1)),
          new CompareExpr("<", new Identifier("y"), new NumberLiteral(2)),
        ),
      ),
    ]),
  );
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
  expect(parse("a = x == 1")).toEqual(
    new Program([
      new ExprStmt(
        new AssignExpr(
          "a",
          new CompareExpr("==", new Identifier("x"), new NumberLiteral(1)),
        ),
      ),
    ]),
  );
});
