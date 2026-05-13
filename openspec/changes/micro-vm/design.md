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

### D8: Function epilogue with implicit zero return

**Choice:** After body emission, if the stack may be empty, emit `CONST 0`; always end functions with `RETURN`. Explicit `return expr` compiles to expression + `RETURN`.

**Alternatives:** Compile error on missing return; implicit return of TOS only.

**Rationale:** Low friction for `__main` and early learning; explicit returns already used in fibonacci.

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

- **[Semantic drift vs `evaluate()`]** → Parity tests on v1 subset; document that VM uses real locals while eval uses a shared variable `Map` with param save/restore
- **[Scope differences inside functions]** → Future `let` inside functions may diverge; acceptable for sketchbook; spec calls out VM rules explicitly
- **[Extensibility pressure]** → Unsupported nodes error at compile time rather than partial runtime behavior
- **[No binary format]** → Structured records only; encoding can be a later change without altering VM semantics

## Migration Plan

Greenfield addition under `sketchbook/vm/`. No changes to production pipeline. Rollback = delete `sketchbook/vm/` and revert tests; `parse.ts` / `grammar.ts` unaffected.

## Open Questions

- None blocking v1. v1.1 candidates: `elseif`, `%`, `^`, short-circuit booleans, unary `-`.
