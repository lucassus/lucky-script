import type { Expr } from "./ast";
import {
  AssignExpr,
  BinaryExpr,
  CompareExpr,
  ExprStmt,
  Identifier,
  NumberLiteral,
  Program,
  UnaryExpr,
} from "./ast";
import grammar from "./grammar.ohm-bundle";

/* ohm-js operation callbacks use dynamically-typed `.toAst()`; keep unsafe rules off for this file. */
/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */

const semantics = grammar.createSemantics();

semantics.addOperation<Program | ExprStmt | Expr | string>("toAst", {
  Program(stmts) {
    return new Program(stmts.children.map((stmt) => stmt.toAst() as ExprStmt));
  },
  Stmt(exp) {
    return new ExprStmt(exp.toAst() as Expr);
  },
  Exp(assignExp) {
    return assignExp.toAst() as Expr;
  },
  AssignExp_assign(identNode, _eq, exprNode) {
    return new AssignExpr(
      identNode.toAst() as string,
      exprNode.toAst() as Expr,
    );
  },
  AssignExp_cmp(cmpExp) {
    return cmpExp.toAst() as Expr;
  },
  CmpExp_gte(left, _op, right) {
    return new CompareExpr(">=", left.toAst() as Expr, right.toAst() as Expr);
  },
  CmpExp_lte(left, _op, right) {
    return new CompareExpr("<=", left.toAst() as Expr, right.toAst() as Expr);
  },
  CmpExp_eq(left, _op, right) {
    return new CompareExpr("==", left.toAst() as Expr, right.toAst() as Expr);
  },
  CmpExp_neq(left, _op, right) {
    return new CompareExpr("!=", left.toAst() as Expr, right.toAst() as Expr);
  },
  CmpExp_gt(left, _op, right) {
    return new CompareExpr(">", left.toAst() as Expr, right.toAst() as Expr);
  },
  CmpExp_lt(left, _op, right) {
    return new CompareExpr("<", left.toAst() as Expr, right.toAst() as Expr);
  },
  CmpExp_add(addExp) {
    return addExp.toAst() as Expr;
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
  ident(_first, _rest) {
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
