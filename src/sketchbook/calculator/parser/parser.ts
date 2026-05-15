import type { Node, NonterminalNode } from "ohm-js";

import type {
  ArithmeticOp,
  CompareOp,
  Expr,
  LogicalOp,
  Program,
  Span,
  Stmt,
} from "./ast";
import grammar from "./grammar.ohm-bundle";

/* ohm-js operation callbacks use dynamically-typed `.toAst()`; keep unsafe rules off for this file. */
/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */

const semantics = grammar.createSemantics();

function spanOf(node: { source: { startIdx: number; endIdx: number } }): Span {
  return { start: node.source.startIdx, end: node.source.endIdx };
}

type BinarySpec =
  | { kind: "Arithmetic"; op: ArithmeticOp }
  | { kind: "Compare"; op: CompareOp }
  | { kind: "Logical"; op: LogicalOp };

function bin(spec: BinarySpec) {
  return function (
    this: NonterminalNode,
    left: NonterminalNode,
    _op: Node,
    right: NonterminalNode,
  ): Expr {
    return {
      ...spec,
      span: spanOf(this),
      left: left.toAst() as Expr,
      right: right.toAst() as Expr,
    };
  };
}

semantics.addOperation<Program | Stmt | Stmt[] | Expr | string | unknown[]>(
  "toAst",
  {
    _iter(...children) {
      return children.map((c) => c.toAst());
    },
    Block(_leadNl, optStmtList, _trailNl) {
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
    Stmt_expr(exp) {
      return {
        kind: "ExprStmt" as const,
        span: spanOf(this),
        expr: exp.toAst() as Expr,
      };
    },
    IfStmt(_ifKw, cond, _nl, block, _endKw) {
      return {
        kind: "IfStmt" as const,
        span: spanOf(this),
        condition: cond.toAst() as Expr,
        body: block.toAst() as Stmt[],
      };
    },
    AssignExp_assign(identNode, _eq, exprNode) {
      return {
        kind: "Assign" as const,
        span: spanOf(this),
        name: identNode.toAst() as string,
        value: exprNode.toAst() as Expr,
      };
    },
    OrExp_or: bin({ kind: "Logical", op: "or" }),
    AndExp_and: bin({ kind: "Logical", op: "and" }),
    NotExp_not(_kw, operand) {
      return {
        kind: "Unary" as const,
        span: spanOf(this),
        op: "not",
        expr: operand.toAst() as Expr,
      };
    },
    CmpExp_gte: bin({ kind: "Compare", op: ">=" }),
    CmpExp_lte: bin({ kind: "Compare", op: "<=" }),
    CmpExp_eq: bin({ kind: "Compare", op: "==" }),
    CmpExp_neq: bin({ kind: "Compare", op: "!=" }),
    CmpExp_gt: bin({ kind: "Compare", op: ">" }),
    CmpExp_lt: bin({ kind: "Compare", op: "<" }),
    AddExp_plus: bin({ kind: "Arithmetic", op: "+" }),
    AddExp_minus: bin({ kind: "Arithmetic", op: "-" }),
    MulExp_times: bin({ kind: "Arithmetic", op: "*" }),
    MulExp_divide: bin({ kind: "Arithmetic", op: "/" }),
    UnaryExp_pos(_plus, unary) {
      // `+x` is a no-op semantically, but the span should still cover the `+`.
      const inner = unary.toAst() as Expr;
      return { ...inner, span: spanOf(this) };
    },
    UnaryExp_neg(_minus, unary) {
      return {
        kind: "Unary" as const,
        span: spanOf(this),
        op: "-",
        expr: unary.toAst() as Expr,
      };
    },
    PriExp_paren(_lp, exp, _rp) {
      // Parens widen the inner expression's span to include the brackets.
      const inner = exp.toAst() as Expr;
      return { ...inner, span: spanOf(this) };
    },
    PriExp_var(identNode) {
      return {
        kind: "Identifier" as const,
        span: spanOf(this),
        name: identNode.toAst() as string,
      };
    },
    // Ohm expands `digit+ ("." digit+)?` into three child nodes for this action dict.
    number(_digits, _dotDigitsOpt1, _dotDigitsOpt2) {
      return {
        kind: "Literal" as const,
        span: spanOf(this),
        value: Number(this.sourceString),
      };
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
