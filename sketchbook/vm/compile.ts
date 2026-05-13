import type { BinaryOp, Exp, Program, Stmt } from "../parse";
import {
  allocateGlobalSlot,
  appendFunctionProto,
  type BytecodeModule,
  createBytecodeModule,
  createFunctionProto,
  type FunctionProto,
  pushConstant,
} from "./bytecode";
import type { Instruction } from "./opcodes";

function compileError(message: string): Error {
  return new Error(`micro-vm compile: ${message}`);
}

function unsupported(feature: string): Error {
  return compileError(`Unsupported in micro-vm v1: ${feature}`);
}

type StmtOpts =
  | { mode: "main_top"; index: number; total: number }
  | { mode: "main_inner" }
  | { mode: "func" };

type LabelPatch = { pc: number };

export class CompileContext {
  readonly module: BytecodeModule;
  readonly currentProto: FunctionProto;
  readonly globalSlotByName: Map<string, number>;
  readonly fnIndexByName: Map<string, number>;

  readonly localSlotByName = new Map<string, number>();
  nextLocalSlot: number;

  private readonly labelTargets = new Map<string, number>();
  private readonly pendingPatches = new Map<string, LabelPatch[]>();
  private labelSeq = 0;

  constructor(
    module: BytecodeModule,
    proto: FunctionProto,
    globalSlotByName: Map<string, number>,
    fnIndexByName: Map<string, number>,
  ) {
    this.module = module;
    this.currentProto = proto;
    this.globalSlotByName = globalSlotByName;
    this.fnIndexByName = fnIndexByName;
    this.nextLocalSlot = proto.arity;

    for (let i = 0; i < proto.localNames.length; i++) {
      const name = proto.localNames[i];
      if (name !== undefined) {
        this.localSlotByName.set(name, i);
      }
    }
  }

  freshLabel(prefix: string): string {
    return `${prefix}_${this.labelSeq++}`;
  }

  emit(instr: Instruction): void {
    this.currentProto.code.push(instr);
  }

  emitConst(value: number): void {
    const idx = pushConstant(this.module, value);
    this.emit({ op: "CONST", index: idx });
  }

  bindLabel(name: string): void {
    const ip = this.currentProto.code.length;
    if (this.labelTargets.has(name)) {
      throw compileError(`duplicate label binding: ${name}`);
    }
    this.labelTargets.set(name, ip);
    const pending = this.pendingPatches.get(name);
    if (pending !== undefined) {
      for (const { pc } of pending) {
        this.patchJumpTarget(pc, ip);
      }
      this.pendingPatches.delete(name);
    }
  }

  emitJumpIfZero(label: string): void {
    const known = this.labelTargets.get(label);
    const pc = this.currentProto.code.length;
    if (known !== undefined) {
      this.emit({ op: "JUMP_IF_ZERO", target: known });
    } else {
      this.emit({ op: "JUMP_IF_ZERO", target: -1 });
      this.recordPending(label, pc);
    }
  }

  emitJump(label: string): void {
    const known = this.labelTargets.get(label);
    const pc = this.currentProto.code.length;
    if (known !== undefined) {
      this.emit({ op: "JUMP", target: known });
    } else {
      this.emit({ op: "JUMP", target: -1 });
      this.recordPending(label, pc);
    }
  }

  private recordPending(label: string, pc: number): void {
    let list = this.pendingPatches.get(label);
    if (list === undefined) {
      list = [];
      this.pendingPatches.set(label, list);
    }
    list.push({ pc });
  }

  private patchJumpTarget(pc: number, ip: number): void {
    const insn = this.currentProto.code[pc];
    if (insn?.op !== "JUMP" && insn?.op !== "JUMP_IF_ZERO") {
      throw compileError("internal: patch target not a jump instruction");
    }
    insn.target = ip;
  }

  assertPatchesResolved(): void {
    if (this.pendingPatches.size > 0) {
      const labels = [...this.pendingPatches.keys()].join(", ");
      throw compileError(`unresolved labels: ${labels}`);
    }
  }
}

function allocLocal(ctx: CompileContext, name: string): number {
  if (ctx.localSlotByName.has(name)) {
    throw compileError(`duplicate let in scope: ${name}`);
  }
  const slot = ctx.nextLocalSlot;
  ctx.nextLocalSlot += 1;
  ctx.localSlotByName.set(name, slot);
  ctx.currentProto.localCount = ctx.nextLocalSlot;
  ctx.currentProto.localNames[slot] = name;
  return slot;
}

function resolveStore(
  ctx: CompileContext,
  name: string,
): { kind: "global" | "local"; slot: number } {
  const local = ctx.localSlotByName.get(name);
  if (local !== undefined) {
    return { kind: "local", slot: local };
  }
  const g = ctx.globalSlotByName.get(name);
  if (g !== undefined) {
    return { kind: "global", slot: g };
  }
  throw compileError(`unknown name: ${name}`);
}

function resolveLoad(ctx: CompileContext, name: string): void {
  const local = ctx.localSlotByName.get(name);
  if (local !== undefined) {
    ctx.emit({ op: "LOAD_L", slot: local });
    return;
  }
  const g = ctx.globalSlotByName.get(name);
  if (g !== undefined) {
    ctx.emit({ op: "LOAD_G", slot: g });
    return;
  }
  throw compileError(`unknown name: ${name}`);
}

function assertSupportedBinary(op: BinaryOp): void {
  switch (op) {
    case "+":
    case "-":
    case "*":
    case "/":
    case "<":
    case "==":
      return;
    case "%":
      throw unsupported("% operator");
    case "^":
      throw unsupported("^ operator");
    case "and":
      throw unsupported("and");
    case "or":
      throw unsupported("or");
    case "!=":
      throw unsupported("!= comparison");
    case "<=":
      throw unsupported("<= comparison");
    case ">=":
      throw unsupported(">= comparison");
    case ">":
      throw unsupported("> comparison");
    default: {
      const _exhaustive: never = op;
      throw unsupported(`operator ${_exhaustive}`);
    }
  }
}

export function compileExpr(ctx: CompileContext, expr: Exp): void {
  switch (expr.kind) {
    case "Literal": {
      if (typeof expr.value === "number") {
        ctx.emitConst(expr.value);
        return;
      }
      if (expr.value === null) {
        throw unsupported("null literal");
      }
      throw unsupported("boolean literal");
    }
    case "Unary":
      throw unsupported(
        expr.op === "not" ? "not" : expr.op === "+" ? "unary +" : "unary -",
      );
    case "Binary": {
      assertSupportedBinary(expr.op);
      compileExpr(ctx, expr.left);
      compileExpr(ctx, expr.right);
      switch (expr.op) {
        case "+":
          ctx.emit({ op: "ADD" });
          break;
        case "-":
          ctx.emit({ op: "SUB" });
          break;
        case "*":
          ctx.emit({ op: "MUL" });
          break;
        case "/":
          ctx.emit({ op: "DIV" });
          break;
        case "<":
          ctx.emit({ op: "LT" });
          break;
        case "==":
          ctx.emit({ op: "EQ" });
          break;
        default:
          break;
      }
      return;
    }
    case "Var": {
      if (expr.name === "null") {
        throw unsupported("null literal");
      }
      resolveLoad(ctx, expr.name);
      return;
    }
    case "Call": {
      const target = ctx.fnIndexByName.get(expr.callee);
      if (target === undefined) {
        throw compileError(`unknown function: ${expr.callee}`);
      }
      for (const arg of expr.args) {
        compileExpr(ctx, arg);
      }
      ctx.emit({ op: "CALL", fn: target, argc: expr.args.length });
      return;
    }
    default: {
      const _never: never = expr;
      throw compileError(`unsupported expression ${String(_never)}`);
    }
  }
}

export function compileStmt(
  ctx: CompileContext,
  stmt: Stmt,
  opts: StmtOpts,
): void {
  switch (stmt.kind) {
    case "FunDef":
      throw unsupported("nested function");
    case "If": {
      if (stmt.elseif.length > 0) {
        throw unsupported("elseif");
      }
      const endLabel = ctx.freshLabel("if_end");
      if (stmt.else !== undefined) {
        const elseLabel = ctx.freshLabel("if_else");
        compileExpr(ctx, stmt.test);
        ctx.emitJumpIfZero(elseLabel);
        compileBlock(ctx, stmt.then, opts);
        ctx.emitJump(endLabel);
        ctx.bindLabel(elseLabel);
        compileBlock(ctx, stmt.else, opts);
        ctx.bindLabel(endLabel);
      } else {
        compileExpr(ctx, stmt.test);
        ctx.emitJumpIfZero(endLabel);
        compileBlock(ctx, stmt.then, opts);
        ctx.bindLabel(endLabel);
      }
      return;
    }
    case "Return":
      compileExpr(ctx, stmt.value);
      ctx.emit({ op: "RETURN" });
      return;
    case "Let": {
      compileExpr(ctx, stmt.init);
      if (opts.mode === "func") {
        const slot = allocLocal(ctx, stmt.name);
        ctx.emit({ op: "STORE_L", slot });
      } else {
        const slot = ctx.globalSlotByName.get(stmt.name);
        if (slot === undefined) {
          throw compileError(`unknown global for let: ${stmt.name}`);
        }
        ctx.emit({ op: "STORE_G", slot });
      }
      return;
    }
    case "Assign": {
      compileExpr(ctx, stmt.value);
      const target = resolveStore(ctx, stmt.name);
      if (target.kind === "global") {
        ctx.emit({ op: "STORE_G", slot: target.slot });
      } else {
        ctx.emit({ op: "STORE_L", slot: target.slot });
      }
      return;
    }
    case "ExprStmt": {
      compileExpr(ctx, stmt.expr);
      if (opts.mode === "main_top" && opts.index === opts.total - 1) {
        return;
      }
      ctx.emit({ op: "POP" });
      return;
    }
    default: {
      const _never: never = stmt;
      throw compileError(`unsupported statement ${String(_never)}`);
    }
  }
}

function compileBlock(
  ctx: CompileContext,
  stmts: Stmt[],
  parentOpts: StmtOpts,
): void {
  const inner: StmtOpts =
    parentOpts.mode === "main_top" || parentOpts.mode === "main_inner"
      ? { mode: "main_inner" }
      : { mode: "func" };
  for (const st of stmts) {
    compileStmt(ctx, st, inner);
  }
}

function compileMainStatements(ctx: CompileContext, stmts: Stmt[]): void {
  const total = stmts.length;
  for (let i = 0; i < stmts.length; i++) {
    compileStmt(ctx, stmts[i]!, { mode: "main_top", index: i, total });
  }
}

function compileFunctionBody(
  module: BytecodeModule,
  proto: FunctionProto,
  body: Stmt[],
  globalSlotByName: Map<string, number>,
  fnIndexByName: Map<string, number>,
): void {
  const ctx = new CompileContext(
    module,
    proto,
    globalSlotByName,
    fnIndexByName,
  );
  for (const st of body) {
    compileStmt(ctx, st, { mode: "func" });
  }
  ctx.emitConst(0);
  ctx.emit({ op: "RETURN" });
  ctx.assertPatchesResolved();
}

function reserveMainGlobalLets(
  stmt: Stmt,
  seen: Set<string>,
  module: BytecodeModule,
): void {
  switch (stmt.kind) {
    case "Let": {
      if (seen.has(stmt.name)) {
        throw compileError(`duplicate top-level let: ${stmt.name}`);
      }
      seen.add(stmt.name);
      allocateGlobalSlot(module, stmt.name);
      break;
    }
    case "If": {
      for (const s of stmt.then) {
        reserveMainGlobalLets(s, seen, module);
      }
      if (stmt.else !== undefined) {
        for (const s of stmt.else) {
          reserveMainGlobalLets(s, seen, module);
        }
      }
      break;
    }
    case "FunDef":
    case "Assign":
    case "ExprStmt":
    case "Return":
      break;
    default: {
      const _n: never = stmt;
      throw compileError(`unsupported statement ${String(_n)}`);
    }
  }
}

export function compile(ast: Program): BytecodeModule {
  const module = createBytecodeModule();

  const mainProto = createFunctionProto("__main", 0);
  mainProto.localCount = 0;
  mainProto.localNames = [];
  module.functions.push(mainProto);

  const fnIndexByName = new Map<string, number>();
  const seenGlobals = new Set<string>();

  for (const stmt of ast.body) {
    if (stmt.kind === "FunDef") {
      continue;
    }
    reserveMainGlobalLets(stmt, seenGlobals, module);
  }

  const globalSlotByName = new Map<string, number>();
  for (let i = 0; i < module.globals.length; i++) {
    const name = module.globals[i];
    if (name !== undefined) {
      globalSlotByName.set(name, i);
    }
  }

  for (const stmt of ast.body) {
    if (stmt.kind === "FunDef") {
      if (fnIndexByName.has(stmt.name)) {
        throw compileError(`duplicate function: ${stmt.name}`);
      }
      const proto = createFunctionProto(stmt.name, stmt.params.length);
      proto.localCount = stmt.params.length;
      proto.localNames = [...stmt.params];
      const idx = appendFunctionProto(module, proto);
      fnIndexByName.set(stmt.name, idx);
    }
  }

  const mainStmts = ast.body.filter((s) => s.kind !== "FunDef");

  const mainCtx = new CompileContext(
    module,
    mainProto,
    globalSlotByName,
    fnIndexByName,
  );
  compileMainStatements(mainCtx, mainStmts);

  const lastMain = mainStmts[mainStmts.length - 1];
  if (lastMain?.kind === "ExprStmt") {
    mainCtx.emit({ op: "RETURN" });
  } else {
    mainCtx.emitConst(0);
    mainCtx.emit({ op: "RETURN" });
  }
  mainCtx.assertPatchesResolved();

  for (const stmt of ast.body) {
    if (stmt.kind === "FunDef") {
      const idx = fnIndexByName.get(stmt.name);
      if (idx === undefined) continue;
      const proto = module.functions[idx];
      if (proto === undefined) continue;
      compileFunctionBody(
        module,
        proto,
        stmt.body,
        globalSlotByName,
        fnIndexByName,
      );
    }
  }

  return module;
}
