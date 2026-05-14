import grammar from "./grammar.ohm-bundle";
import type { Expr, Program, Stmt } from "./ast";

/* ohm-js operation callbacks use dynamically-typed `.toAst()`; keep unsafe rules off for this file. */
/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */

const semantics = grammar.createSemantics();

semantics.addOperation<Program | Stmt | Stmt[] | Expr | string | unknown[]>(
  "toAst",
  {
    _iter(...children) {
      return children.map((c) => c.toAst());
    },
    Program(block) {
      return block.toAst() as Program;
    },
    Block(leadNl, optStmtList, trailNl) {
      void leadNl;
      void trailNl;
      if (optStmtList.children.length === 0) {
        return [];
      }
      return optStmtList.children[0]!.toAst() as Stmt[];
    },
    StmtList(head, _nlChunks, restStmts) {
      const stmts: Stmt[] = [head.toAst() as Stmt];
      for (const s of restStmts.children) {
        stmts.push(s.toAst() as Stmt);
      }
      return stmts;
    },
    Stmt(child) {
      return child.toAst() as Stmt;
    },
    ExpStmt(exp) {
      return { kind: "ExprStmt" as const, expr: exp.toAst() as Expr };
    },
    IfStmt(_ifKw, cond, _nl, block, _endKw) {
      return {
        kind: "IfStmt" as const,
        condition: cond.toAst() as Expr,
        body: block.toAst() as Stmt[],
      };
    },
    Exp(assignExp) {
      return assignExp.toAst() as Expr;
    },
    AssignExp_assign(identNode, _eq, exprNode) {
      return {
        kind: "Assign" as const,
        name: identNode.toAst() as string,
        value: exprNode.toAst() as Expr,
      };
    },
    AssignExp_or(orExp) {
      return orExp.toAst() as Expr;
    },
    OrExp_or(left, _op, right) {
      return {
        kind: "Logical" as const,
        op: "or",
        left: left.toAst() as Expr,
        right: right.toAst() as Expr,
      };
    },
    OrExp_and(andExp) {
      return andExp.toAst() as Expr;
    },
    AndExp_and(left, _op, right) {
      return {
        kind: "Logical" as const,
        op: "and",
        left: left.toAst() as Expr,
        right: right.toAst() as Expr,
      };
    },
    AndExp_not(notExp) {
      return notExp.toAst() as Expr;
    },
    NotExp_not(_kw, operand) {
      return {
        kind: "Unary" as const,
        op: "not",
        expr: operand.toAst() as Expr,
      };
    },
    NotExp_cmp(cmpExp) {
      return cmpExp.toAst() as Expr;
    },
    CmpExp_gte(left, _op, right) {
      return {
        kind: "Compare" as const,
        op: ">=",
        left: left.toAst() as Expr,
        right: right.toAst() as Expr,
      };
    },
    CmpExp_lte(left, _op, right) {
      return {
        kind: "Compare" as const,
        op: "<=",
        left: left.toAst() as Expr,
        right: right.toAst() as Expr,
      };
    },
    CmpExp_eq(left, _op, right) {
      return {
        kind: "Compare" as const,
        op: "==",
        left: left.toAst() as Expr,
        right: right.toAst() as Expr,
      };
    },
    CmpExp_neq(left, _op, right) {
      return {
        kind: "Compare" as const,
        op: "!=",
        left: left.toAst() as Expr,
        right: right.toAst() as Expr,
      };
    },
    CmpExp_gt(left, _op, right) {
      return {
        kind: "Compare" as const,
        op: ">",
        left: left.toAst() as Expr,
        right: right.toAst() as Expr,
      };
    },
    CmpExp_lt(left, _op, right) {
      return {
        kind: "Compare" as const,
        op: "<",
        left: left.toAst() as Expr,
        right: right.toAst() as Expr,
      };
    },
    CmpExp_add(addExp) {
      return addExp.toAst() as Expr;
    },
    AddExp_plus(left, _plus, right) {
      return {
        kind: "Arithmetic" as const,
        op: "+",
        left: left.toAst() as Expr,
        right: right.toAst() as Expr,
      };
    },
    AddExp_minus(left, _minus, right) {
      return {
        kind: "Arithmetic" as const,
        op: "-",
        left: left.toAst() as Expr,
        right: right.toAst() as Expr,
      };
    },
    AddExp_mul(mul) {
      return mul.toAst() as Expr;
    },
    MulExp_times(left, _star, right) {
      return {
        kind: "Arithmetic" as const,
        op: "*",
        left: left.toAst() as Expr,
        right: right.toAst() as Expr,
      };
    },
    MulExp_divide(left, _slash, right) {
      return {
        kind: "Arithmetic" as const,
        op: "/",
        left: left.toAst() as Expr,
        right: right.toAst() as Expr,
      };
    },
    MulExp_unary(unary) {
      return unary.toAst() as Expr;
    },
    UnaryExp_pos(_plus, unary) {
      return unary.toAst() as Expr;
    },
    UnaryExp_neg(_minus, unary) {
      return {
        kind: "Unary" as const,
        op: "-",
        expr: unary.toAst() as Expr,
      };
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
      return { kind: "Variable" as const, name: identNode.toAst() as string };
    },
    // Ohm expands `digit+ ("." digit+)?` into three child nodes for this action dict.
    number(_digits, _dotDigitsOpt1, _dotDigitsOpt2) {
      return { kind: "Literal" as const, value: Number(this.sourceString) };
    },
    ident(_first, _rest) {
      return this.sourceString;
    },
  },
);

export function parse(code: string): Program {
  const matchResult = grammar.match(code);

  if (matchResult.failed()) {
    throw new Error(matchResult.message);
  }

  return semantics(matchResult).toAst();
}
