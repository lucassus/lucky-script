import type { Expr } from "./ast";
import {
  BinaryExpr,
  ExprStmt,
  Identifier,
  LetStmt,
  NumberLiteral,
  Program,
  UnaryExpr,
} from "./ast";
import grammar from "./grammar.ohm-bundle";

/* ohm-js operation callbacks use dynamically-typed `.toAst()`; keep unsafe rules off for this file. */
/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */

const semantics = grammar.createSemantics();

semantics.addOperation<Program | ExprStmt | LetStmt | Expr | string>("toAst", {
  Program(stmts) {
    return new Program(
      stmts.children.map((stmt) => stmt.toAst() as ExprStmt | LetStmt),
    );
  },
  Stmt_letBind(_letKw, identNode, _eq, expr) {
    return new LetStmt(identNode.toAst() as string, expr.toAst() as Expr);
  },
  Stmt_exprOnly(expr) {
    return new ExprStmt(expr.toAst() as Expr);
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
  PriExp_var(identNode) {
    return new Identifier(identNode.toAst() as string);
  },
  // Ohm expands `digit+ ("." digit+)?` into three child nodes for this action dict.
  number(_digits, _dotDigitsOpt1, _dotDigitsOpt2) {
    return new NumberLiteral(Number(this.sourceString));
  },
  ident(_notKeyword, _rest) {
    return this.sourceString;
  },
});

export function parse(code: string): Program {
  const matchResult = grammar.match(code);

  if (matchResult.failed()) {
    throw new Error(matchResult.message);
  }

  return semantics(matchResult).toAst();
}
