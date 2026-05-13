## 1. Types and bytecode model

- [ ] 1.1 Create `sketchbook/vm/opcodes.ts` with the v1 `Instruction` discriminated union
- [ ] 1.2 Create `sketchbook/vm/bytecode.ts` with `BytecodeModule`, `FunctionProto`, and helper constructors
- [ ] 1.3 Create `sketchbook/vm/disasm.ts` with `disassemble(module)` for readable debug output
- [ ] 1.4 Add `bytecode.test.ts` covering module shape and disassembly of a tiny hand-written sample

## 2. Stack VM core

- [ ] 2.1 Create `sketchbook/vm/vm.ts` with operand stack, `CallFrame`, and `run(module)` entry
- [ ] 2.2 Define `StackUnderflowError extends Error` in `sketchbook/vm/vm.ts` and use it from every stack pop
- [ ] 2.3 Implement `CONST`, `ADD`, `RETURN`, and function epilogue handling (returns TOS for the outermost frame)
- [ ] 2.4 Add `vm.test.ts` with a hand-written `__main` module that evaluates `1 + 2`
- [ ] 2.5 Implement `SUB`, `MUL`, `DIV`, `LT`, `EQ`, and `POP`
- [ ] 2.6 Add VM tests for arithmetic and comparison opcodes in isolation
- [ ] 2.7 Add a VM test asserting a hand-written underflow case throws `StackUnderflowError`

## 3. Variables and globals

- [ ] 3.1 Implement `LOAD_G`, `STORE_G` against a module-global slot array
- [ ] 3.2 Add VM tests for top-level global load/store behavior
- [ ] 3.3 Implement `LOAD_L`, `STORE_L` against frame locals
- [ ] 3.4 Add VM tests for local slot reads and writes inside a single frame

## 4. Calls, frames, and control flow

- [ ] 4.1 Implement `CALL` by function index with argc argument binding into local slots
- [ ] 4.2 Implement nested/recursive `CALL` / `RETURN` protocol on the call stack
- [ ] 4.3 Add VM tests for a hand-written recursive function proto (e.g. countdown or fib step)
- [ ] 4.4 Implement `JUMP` and `JUMP_IF_ZERO`
- [ ] 4.5 Add VM tests for conditional branching using numeric truth values

## 5. Compiler scaffolding

- [ ] 5.1 Create `sketchbook/vm/compile.ts` with `CompileContext` (module builder, current function, label pool, global table, per-function local table)
- [ ] 5.2 Implement `compile(ast: Program): BytecodeModule` entry and synthetic `__main` at index `0`
- [ ] 5.3 Pass 1: scan top-level statements; allocate global slots for every top-level `Let` and register `name -> proto index` for every `FunDef`
- [ ] 5.4 Implement compile-time rejection for unsupported nodes (`elseif`, `%`, `^`, logical/unary/extra comparison ops, boolean and `null` literals) with `micro-vm compile:` prefixed errors
- [ ] 5.5 Implement `compileExpr` for numeric `Literal` and supported binary operators (`+`, `-`, `*`, `/`, `<`, `==`)
- [ ] 5.6 Implement name resolution for `Var` and `Assign`: local first, global fallback, otherwise compile error
- [ ] 5.7 Implement `compileStmt` for `Let` (allocate in current scope; duplicate-name is a compile error), `Assign`, `Return`
- [ ] 5.8 Implement `compileStmt` for `ExprStmt` with stack discipline per D8: emit `POP` after the value when it is not the last top-level statement of `__main`
- [ ] 5.9 Implement `compileStmt` for `FunDef` (pass 2 fills the pre-registered proto's body) and `Call` (resolve callee via the pass-1 table; unknown callee is a compile error)
- [ ] 5.10 Implement `compileStmt` for `If` with optional `else` using forward label patching
- [ ] 5.11 Append function epilogue per D8: `__main` whose last stmt is `ExprStmt` ends in `RETURN` only; otherwise emit `CONST 0; RETURN`. User functions always emit `CONST 0; RETURN` as a safety net

## 6. Compiler tests

- [ ] 6.1 Add `compile.test.ts` golden fixtures for `1 + 2`, `let x = 10; x`, and a simple `if`/`else`
- [ ] 6.2 Add compile tests asserting unsupported nodes produce `micro-vm compile:` errors (`elseif`, `%`, `^`, `and`, `or`, `not`, `!=`, `<=`, `>=`, `>`, unary `+`/`-`, boolean literal, `null` literal)
- [ ] 6.3 Add compile golden for a minimal `fun` definition plus top-level call (asserts `__main` ends with `CALL` then `RETURN`)
- [ ] 6.4 Add compile test for a forward call: function `f` calls `g` defined later in source
- [ ] 6.5 Add compile test for global fallback: a function body reads and writes a top-level binding, asserting `LOAD_G`/`STORE_G` are emitted
- [ ] 6.6 Add compile test asserting an unknown name (`Var foo` with no `let foo`) produces a `micro-vm compile:` error

## 7. End-to-end parity

- [ ] 7.1 Add `parity.test.ts` comparing `run(compile(parse(src)))` with `evaluate(src)` for small arithmetic and `let` scripts; every source MUST end with an `ExprStmt` (see D13)
- [ ] 7.2 Add fibonacci parity table (`n` 0–9) using the sketchbook recursive fib program from `grammar.test.ts`, with a trailing `fib(n)` `ExprStmt` per `n`
- [ ] 7.3 Add at least one parity test for `if` with `else` and one for `if` without `else`, each ending in an `ExprStmt`

## 8. Verification

- [ ] 8.1 Run `yarn test sketchbook/vm`
- [ ] 8.2 Run `yarn lint`
- [ ] 8.3 Run `yarn typecheck`
- [ ] 8.4 Run `yarn test`
