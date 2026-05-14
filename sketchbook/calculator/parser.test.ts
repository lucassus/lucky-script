import { expect, test } from "vitest";

import {
  AssignExpr,
  BinaryExpr,
  ExprStmt,
  Identifier,
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
