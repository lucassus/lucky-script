## Context

The sketchbook pipeline today is:

`grammar.ohm` → `parse()` → AST (`sketchbook/parse.ts`) → tree-walking `evaluate()` (`sketchbook/grammar.ts`)

This is ideal for syntax experiments and quick semantic checks (including recursive fibonacci via `evaluate()`), but it does not expose bytecode lowering, operand stacks, call frames, or jump-based control flow.

The production Lucky Script pipeline (`Lexer` → `Parser` → `Interpreter`) is larger in scope (strings, closures, `while`, `local`/`outer`, etc.). The `add-tiny-core-vm` change targets that AST. **micro-vm** intentionally targets the **sketchbook AST** only, as a self-contained learning backend.

## Goals / Non-Goals

**Goals:**

- Add `parse()` → `compile()` → `run()` under `sketchbook/vm/`
- Use structured, human-readable `Instruction` records with slot indices and label patching
- Support a fibonacci-shaped v1 subset: globals + frame locals, named functions, `CALL` by function index, `if`/`else`, `return`, `+ - * /`, `< ==`
- Compile unsupported sketchbook AST nodes to clear errors (extensible `compile.ts` with `CompileContext`)
- Layered tests: compile goldens, opcode-level VM tests, parity with `evaluate()` on supported programs
- Keep `evaluate()` unchanged as the sketchbook reference backend

**Non-Goals:**

- Closures, upvalues, or first-class function values
- `elseif` chains, short-circuit `and`/`or`, unary ops, `%`, `^`, extra comparisons in v1
- Integration with `src/Parser` or `src/Interpreter`
- Optimization passes, JIT, bytecode verification, or binary encoding
- Changing sketchbook surface syntax (`^`, `//`, etc.)

## Decisions

### D1: Sketchbook AST as the sole compile input

**Choice:** `compile(ast: Program)` consumes `sketchbook/parse.ts` types only.

**Alternatives:** Main `AstNode.ts`; staged `LuckyScript` grammar AST.

**Rationale:** Parse + eval already live together; fibonacci parity tests exist; avoids production scope semantics before stack frames are understood.

### D2: Structured instruction records

**Choice:** `Instruction` is a discriminated union, e.g. `{ op: "ADD" }`, `{ op: "CONST", index: 0 }`, `{ op: "JUMP_IF_ZERO", target: 12 }`.

**Alternatives:** Flat numeric tape; text assembly source.

**Rationale:** Easy to inspect in tests and logs; optional `disasm.ts` prints readable output without a parser.

### D3: Number-only runtime values

**Choice:** Operand stack and locals hold `number`. Truthiness: `0` is false, non-zero is true. Comparisons push `1` or `0`.

**Alternatives:** Tagged unions for bool/null.

**Rationale:** Matches sketchbook `evaluate()` normalization; keeps VM loop small.

### D4: Globals + per-frame locals; no closures

**Choice:** Top-level `let`/assign → global slots. Function params and in-function bindings → local slots in the current frame. Inner frames do not capture outer locals.

**Alternatives:** Globals-only (mirror eval's shared `Map`); single flat slot table.

**Rationale:** Teaches real call frames and recursion; aligns with roadmap Stage 3–4 goals.

### D5: `CALL` by function index

**Choice:** `{ op: "CALL", fn: 1, argc: 1 }` indexes `module.functions[1]`.

**Alternatives:** Callee name string at runtime; stack-polymorphic `CALL`.

**Rationale:** Named defs only in sketchbook; disassembler can print function names from metadata.

### D6: Synthetic `__main` at index 0

**Choice:** Top-level statements compile into `functions[0]` (`name: "__main"`, `arity: 0`); `module.entry = 0`. Named `fun` defs append additional protos.

**Alternatives:** Separate module-level code array.

**Rationale:** VM always starts with one call protocol; function defs are compile-time only until invoked.

### D7: Control flow via `JUMP_IF_ZERO` + label patching

**Choice:** Compile `if` test, emit conditional jump to else/end, compile branches, patch forward labels after emission.

**Alternatives:** Fused compare-branch opcodes; flag register.

**Rationale:** Standard pattern; same label pool extends to `elseif` and short-circuit logic later.

### D8: Function epilogue and statement stack discipline

**Choice:** Every statement is net-zero stack effect, with one exception: the **last** top-level statement of `__main` is allowed to be an `ExprStmt` that leaves its value on TOS so the implicit `RETURN` returns it.

- `Let` / `Assign`: `compileExpr` pushes the value, then `STORE_G` / `STORE_L` pops it. Net: 0.
- `ExprStmt` (not last in `__main`): `compileExpr` pushes the value, then `POP`. Net: 0.
- `ExprStmt` (last in `__main`): `compileExpr` pushes the value; the epilogue's `RETURN` consumes it. Net: +1 at epilogue.
- `Return expr`: `compileExpr` pushes, then `RETURN`.
- Other stmts (`FunDef` at top level): no instructions emitted into `__main`.

Function epilogue:

- `__main` whose last source stmt is an `ExprStmt`: emit `RETURN` only.
- `__main` otherwise, and every user function without a guaranteed explicit `Return` on every path: emit `CONST 0; RETURN`.

**Alternatives:** Always pop `ExprStmt` and track "last value" via a dedicated slot; compile error on missing return.

**Rationale:** Keeps stack discipline simple to assert in tests, matches the way `evaluate()`'s `evalStmts` returns the last value when that value is an expression, and avoids a per-VM "result register."

### D9: Slot indices in instructions; names in module metadata

**Choice:** `LOAD_G` / `STORE_G` / `LOAD_L` / `STORE_L` carry numeric slots; `BytecodeModule.globals` and per-function local name tables support disassembly.

**Alternatives:** Inline name strings in each instruction.

**Rationale:** VM hot path uses array indexing; names remain available for debugging.

### D10: Single-module compiler with `CompileContext`

**Choice:** `compile.ts` with `compileStmt` / `compileExpr` helpers and shared `CompileContext` (module builder, symbol tables, label pool, current function).

**Alternatives:** Visitor hierarchy; multi-pass pipeline.

**Rationale:** ~10 node kinds in v1; extensibility = new `case` branches and opcodes, not new frameworks.

### D11: File layout under `sketchbook/vm/`

**Choice:**

```
sketchbook/vm/
  opcodes.ts      Instruction union
  bytecode.ts     BytecodeModule, FunctionProto
  compile.ts      compile(ast)
  vm.ts           run(module)
  disasm.ts       format(module) → string
  *.test.ts       compile, vm, parity
```

**Alternatives:** Flat `sketchbook/`; monolithic single file.

**Rationale:** Clear separation as the backend grows; matches user preference for a dedicated subfolder.

### D12: Layered test strategy

**Choice:** (1) compile golden tests for micro-snippets, (2) hand-written minimal modules per opcode family, (3) `evaluate()` parity on fibonacci table and selected scripts.

**Alternatives:** End-to-end parity only; instruction trace assertions.

**Rationale:** Isolates compile bugs from VM bugs while staying maintainable.

### D13: Parity test scope constrained to ExprStmt-tailed programs

**Choice:** `evaluate()` returns the value of the last evaluated statement (including `Let`/`Assign` which return the bound value). The VM, per D8, only returns a non-zero `__main` result when the last statement is an `ExprStmt`. Parity tests therefore MUST use programs whose last top-level statement is an `ExprStmt`.

**Alternatives:** Make every statement compute a "last value" slot to match `evaluate()` exactly; weaken the parity claim to "side effects equal."

**Rationale:** Avoids dragging an extra result slot through every opcode; the constraint is trivial to satisfy in tests (append `fib(n)` or similar at the end) and matches how a user would actually drive the VM.

### D14: Name resolution inside functions: locals first, globals as fallback

**Choice:** Compiler maintains a per-function local symbol table over a single module-level global table.

- `Var name`: look up in current function's locals; on miss, look up in globals; otherwise compile error `Unknown name: <name>`.
- `Assign name = expr`: same resolution order; emit `STORE_L` or `STORE_G` accordingly; unknown name → compile error.
- `Let name = expr`: always allocates in the current scope's table (function locals when inside a `FunDef`, globals when at top level). Re-declaring an existing name in the same scope is a compile error.
- No closures: a function CANNOT read or write locals belonging to an outer function. Resolution never walks the function-frame stack.

**Alternatives:** Globals-only (matches `evaluate()`'s single `Map`); locals-only with no global fallback inside functions (would break fibonacci patterns that read top-level constants).

**Rationale:** Real call-frame semantics for parameters/locals plus a familiar "globals are visible inside functions" rule. The remaining behavioral gap with `evaluate()` is that the VM does NOT save/restore globals on call (the param-save trick in `evaluate()`); this is acceptable because params now live on the frame, not in the global `Map`.

### D15: Two-pass `FunDef` compilation for forward references

**Choice:** Compilation is two passes over the program body.

- Pass 1: walk top-level statements; for every `FunDef`, allocate a `FunctionProto` (name, arity, empty `code`) and register `name → index` in the module's function table. Also pre-register a global slot for every top-level `Let`.
- Pass 2: compile bodies. `Call` resolves the callee via the table populated in pass 1, so a function may call any other top-level function regardless of source order, including itself.

**Alternatives:** Single pass with a "pending call patch list"; require source-order declaration before use.

**Rationale:** Recursion and mutual recursion both work with no patching. Compile error `Unknown function: <name>` if the callee isn't in the table at the end of pass 1.

### D16: Boolean and null literals rejected in v1

**Choice:** Any `Literal` whose `value` is `true`, `false`, or `null` fails at compile time with `Unsupported in micro-vm v1: boolean literal` / `Unsupported in micro-vm v1: null literal`.

**Alternatives:** Map `true → 1`, `false → 0`, `null → 0`.

**Rationale:** v1 is number-only. Half-supporting booleans invites silent semantic drift with `evaluate()` once short-circuit `and`/`or` lands later. Rejecting now is cheap; lifting the restriction is a one-line change in v1.1.

### D17: Error conventions

**Choice:** Two error families with stable message prefixes.

- Compile errors: `Error("micro-vm compile: <message>")` thrown from `compile.ts`. Used for unsupported nodes, unknown names, unknown functions, duplicate `let`.
- Runtime errors: dedicated subclasses thrown from `vm.ts`:
  - `StackUnderflowError extends Error` — message `"micro-vm runtime: stack underflow"`.
  - Other runtime conditions use `Error("micro-vm runtime: <message>")` (e.g. division by zero if we ever check, frame stack overflow).

**Alternatives:** A single `MicroVmError` class with a `kind` tag; plain `Error` for everything.

**Rationale:** Tests can assert on the `StackUnderflowError` type without string-matching, while the rest of the error surface stays cheap. The prefix convention keeps unprefixed message matching reliable for compile errors.

## Data Model

### BytecodeModule

```typescript
BytecodeModule {
  constants: number[]
  globals: string[]              // slot → name (debug + compile resolution)
  functions: FunctionProto[]
  entry: 0                       // __main
}

FunctionProto {
  name: string
  arity: number
  localCount: number
  localNames: string[]           // debug
  code: Instruction[]
}
```

### VM state

```typescript
VM {
  module: BytecodeModule
  stack: number[]
  frames: CallFrame[]
  globals: number[]                // parallel to module.globals slots
}

CallFrame {
  fn: FunctionProto
  ip: number
  locals: number[]
}
```

## Instruction Set (v1)

```
CONST index
LOAD_G slot    STORE_G slot
LOAD_L slot    STORE_L slot
ADD  SUB  MUL  DIV
LT   EQ
JUMP target
JUMP_IF_ZERO target
CALL fnIndex argc
RETURN
POP
```

Unsupported AST features MUST fail at compile time with messages like `Unsupported in micro-vm v1: elseif`.

## Compiler Flow (fibonacci-shaped)

1. Begin `__main` proto.
2. For each top-level `FunDef`, compile body into a new `FunctionProto` (do not execute).
3. For other top-level stmts, emit into `__main`.
4. Resolve labels to instruction indices.
5. Append function epilogue (`CONST 0` if needed, `RETURN`).

`if test then thenBranch else elseBranch end`:

```
compileExpr(test)
JUMP_IF_ZERO elseLabel
compileStmts(then)
JUMP endLabel            ; when else present
elseLabel:
compileStmts(else)       ; optional
endLabel:
```

## Risks / Trade-offs

- **[Semantic drift vs `evaluate()`]** → Parity tests on v1 subset and constrained to ExprStmt-tailed programs (D13); VM uses real locals while eval uses a shared `Map` with param save/restore.
- **[Top-level mutation from inside functions]** → Globals are readable inside functions and writable via `Assign` (D14). A program that mutates a top-level binding from a function will produce correct numeric results, but the order of side effects differs from `evaluate()`'s shared-`Map` model. Not exercised by v1 parity tests.
- **[Extensibility pressure]** → Unsupported nodes error at compile time rather than partial runtime behavior; boolean/null are explicitly rejected in v1 (D16).
- **[No binary format]** → Structured records only; encoding can be a later change without altering VM semantics.

## Migration Plan

Greenfield addition under `sketchbook/vm/`. No changes to production pipeline. Rollback = delete `sketchbook/vm/` and revert tests; `parse.ts` / `grammar.ts` unaffected.

## Open Questions

- None blocking v1. v1.1 candidates: `elseif`, `%`, `^`, short-circuit booleans, unary `-`.
