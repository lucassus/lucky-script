import fs from "node:fs";
import path from "node:path";

import * as ohmNs from "ohm-js";

/* ohm-js operation callbacks use dynamically-typed `.toAst()`; keep unsafe rules off for this file. */
/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */

export abstract class Expr {}

export class NumberLiteral extends Expr {
  constructor(public readonly value: number) {
    super();
  }
}

export class UnaryExpr extends Expr {
  readonly operator = "-" as const;

  constructor(public readonly operand: Expr) {
    super();
  }
}

export class BinaryExpr extends Expr {
  constructor(
    public readonly operator: "+" | "-" | "*" | "/",
    public readonly left: Expr,
    public readonly right: Expr,
  ) {
    super();
  }
}

export class Stmt {
  constructor(public readonly expr: Expr) {}
}

export class Program {
  constructor(public readonly body: Stmt[] = []) {}
}

const grammar = ohmNs.grammar(
  fs.readFileSync(path.join(__dirname, "grammar.ohm"), "utf-8"),
);

const semantics = grammar.createSemantics();

semantics.addOperation<Program | Stmt | Expr>("toAst", {
  Program(stmts) {
    return new Program(stmts.children.map((stmt) => stmt.toAst() as Stmt));
  },
  Stmt(expr) {
    return new Stmt(expr.toAst() as Expr);
  },
  Exp(add) {
    return add.toAst() as Expr;
  },
  AddExp_plus(left, _plus, right) {
    return new BinaryExpr("+", left.toAst() as Expr, right.toAst() as Expr);
  },
  AddExp_minus(left, _minus, right) {
    return new BinaryExpr("-", left.toAst() as Expr, right.toAst() as Expr);
  },
  AddExp_mul(mul) {
    return mul.toAst() as Expr;
  },
  MulExp_times(left, _star, right) {
    return new BinaryExpr("*", left.toAst() as Expr, right.toAst() as Expr);
  },
  MulExp_divide(left, _slash, right) {
    return new BinaryExpr("/", left.toAst() as Expr, right.toAst() as Expr);
  },
  MulExp_unary(unary) {
    return unary.toAst() as Expr;
  },
  UnaryExp_pos(_plus, unary) {
    return unary.toAst() as Expr;
  },
  UnaryExp_neg(_minus, unary) {
    return new UnaryExpr(unary.toAst() as Expr);
  },
  UnaryExp_pri(pri) {
    return pri.toAst() as Expr;
  },
  PriExp_paren(_lp, exp, _rp) {
    return exp.toAst() as Expr;
  },
  PriExp_lit(num) {
    return num.toAst() as Expr;
  },
  // Ohm expands `digit+ ("." digit+)?` into three child nodes for this action dict.
  number(_digits, _dotDigitsOpt1, _dotDigitsOpt2) {
    return new NumberLiteral(Number(this.sourceString));
  },
});

export function parse(code: string): Program {
  const matchResult = grammar.match(code);

  if (matchResult.failed()) {
    throw new Error(matchResult.message);
  }

  return semantics(matchResult).toAst();
}
