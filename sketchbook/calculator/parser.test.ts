import { expect, test } from "vitest";

import {
  BinaryExpr,
  NumberLiteral,
  parse,
  Program,
  Stmt,
  UnaryExpr,
} from "./parser";

test("precedence: addition below multiplication", () => {
  expect(parse("1 + 2 * 3")).toEqual(
    new Program([
      new Stmt(
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
      new Stmt(
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
    new Program([new Stmt(new UnaryExpr(new NumberLiteral(2)))]),
  );

  expect(parse("+2")).toEqual(new Program([new Stmt(new NumberLiteral(2))]));

  expect(parse("-(-1)")).toEqual(
    new Program([new Stmt(new UnaryExpr(new UnaryExpr(new NumberLiteral(1))))]),
  );
});

test("subtraction is left-associative", () => {
  expect(parse("10 - 3 - 2")).toEqual(
    new Program([
      new Stmt(
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
      new Stmt(
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
      new Stmt(
        new BinaryExpr("+", new NumberLiteral(3.14), new NumberLiteral(2)),
      ),
    ]),
  );
});

test("multiple statements", () => {
  expect(parse("1+2\n3+4")).toEqual(
    new Program([
      new Stmt(new BinaryExpr("+", new NumberLiteral(1), new NumberLiteral(2))),
      new Stmt(new BinaryExpr("+", new NumberLiteral(3), new NumberLiteral(4))),
    ]),
  );
});
