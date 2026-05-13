## 1. Types and bytecode model

- [ ] 1.1 Create `sketchbook/vm/opcodes.ts` with the v1 `Instruction` discriminated union
- [ ] 1.2 Create `sketchbook/vm/bytecode.ts` with `BytecodeModule`, `FunctionProto`, and helper constructors
- [ ] 1.3 Create `sketchbook/vm/disasm.ts` with `disassemble(module)` for readable debug output
- [ ] 1.4 Add `bytecode.test.ts` covering module shape and disassembly of a tiny hand-written sample

## 2. Stack VM core

- [ ] 2.1 Create `sketchbook/vm/vm.ts` with operand stack, `CallFrame`, and `run(module)` entry
- [ ] 2.2 Implement `CONST`, `ADD`, `RETURN`, and function epilogue handling
- [ ] 2.3 Add `vm.test.ts` with a hand-written `__main` module that evaluates `1 + 2`
- [ ] 2.4 Implement `SUB`, `MUL`, `DIV`, `LT`, `EQ`, and `POP`
- [ ] 2.5 Add VM tests for arithmetic and comparison opcodes in isolation

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

- [ ] 5.1 Create `sketchbook/vm/compile.ts` with `CompileContext`, label pool, and slot assignment tables
- [ ] 5.2 Implement `compile(ast: Program): BytecodeModule` entry and synthetic `__main` at index `0`
- [ ] 5.3 Implement compile-time rejection for unsupported nodes (`elseif`, `%`, `^`, logical/unary/extra comparison ops)
- [ ] 5.4 Implement `compileExpr` for numeric literals and supported binary operators
- [ ] 5.5 Implement `compileStmt` for `Let`, `Assign`, `ExprStmt`, and `Return`
- [ ] 5.6 Implement `compileStmt` for `FunDef` (append proto only) and `Call`
- [ ] 5.7 Implement `compileStmt` for `If` with optional `else` using forward label patching
- [ ] 5.8 Append function epilogue (`CONST 0` when needed, `RETURN`) for `__main` and user functions

## 6. Compiler tests

- [ ] 6.1 Add `compile.test.ts` golden fixtures for `1 + 2`, `let x = 10`, and a simple `if`/`else`
- [ ] 6.2 Add compile tests asserting unsupported nodes produce clear errors
- [ ] 6.3 Add compile golden for a minimal `fun` definition plus top-level call

## 7. End-to-end parity

- [ ] 7.1 Add `parity.test.ts` comparing `run(compile(parse(src)))` with `evaluate(src)` for small arithmetic and `let` scripts
- [ ] 7.2 Add fibonacci parity table (`n` 0–9) using the sketchbook recursive fib program from `grammar.test.ts`
- [ ] 7.3 Add at least one parity test for `if` with `else` and one for `if` without `else`

## 8. Verification

- [ ] 8.1 Run `yarn test sketchbook/vm`
- [ ] 8.2 Run `yarn lint`
- [ ] 8.3 Run `yarn typecheck`
- [ ] 8.4 Run `yarn test`
