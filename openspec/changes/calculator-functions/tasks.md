## 1. Grammar and bundles

- [ ] 1.1 In `sketchbook/calculator/parser/grammar.ohm`: define `def_kw = kw<"def">` and `return_kw = kw<"return">`; add both to the `keyword` union so `ident = ~keyword letter alnum*` rejects them as bare identifiers
- [ ] 1.2 Add the `FunDef` production: `FunDef = def_kw ident "(" Params? ")" nl+ Block end_kw`; add `Params = ident ("," ident)*`
- [ ] 1.3 Add the `ReturnStmt` production: `ReturnStmt = return_kw AssignExp?`
- [ ] 1.4 Add `FunDef` and `ReturnStmt` to the `Stmt` alternation (grammar admits them everywhere; the compiler will reject nested `def` and orphan `return`)
- [ ] 1.5 Add a `PriExp_call` alternative **before** `PriExp_var`: `PriExp = ident "(" Args? ")" -- call | "(" AssignExp ")" -- paren | number | ident -- var`; add `Args = AssignExp ("," AssignExp)*`
- [ ] 1.6 Run `yarn ohm:bundles` and verify `grammar.ohm-bundle.js` / `.d.ts` regenerate cleanly

## 2. AST

- [ ] 2.1 In `sketchbook/calculator/parser/ast.ts`: add `Call extends Node<"Call"> { name: string; args: readonly Expr[] }` and add it to the `Expr` union
- [ ] 2.2 Add `FunDef extends Node<"FunDef"> { name: string; params: readonly string[]; body: readonly Stmt[] }`
- [ ] 2.3 Add `ReturnStmt extends Node<"ReturnStmt"> { value?: Expr }`
- [ ] 2.4 Add `FunDef` and `ReturnStmt` to the `Stmt` union

## 3. Parser semantics

- [ ] 3.1 In `parser.ts`, add a `FunDef` Ohm action returning `{ kind: "FunDef", span, name, params, body }`. The `Params?` group surfaces as an iteration node; when absent, `params = []`; when present, map each `ident.toAst()` to a string
- [ ] 3.2 Add a `ReturnStmt` Ohm action returning `{ kind: "ReturnStmt", span, value? }`. The optional `AssignExp` is an iteration node; when absent, omit `value`; when present, set it to the parsed expression
- [ ] 3.3 Add a `PriExp_call` Ohm action returning `{ kind: "Call", span, name, args }`. Handle the `Args?` group identically to `Params?`
- [ ] 3.4 Add parser tests in `parser.test.ts` covering: (a) `def f() end` (empty params, empty body), (b) `def f(a, b) ... end` (multi-param, non-empty body), (c) `return` (bare) inside a function, (d) `return <expr>` inside a function, (e) `f(1, 2)` as an expression in arithmetic context, (f) `f()` as a statement (parses as `ExprStmt(Call)`), (g) nested call `outer(inner(1), 2)`, (h) bare `def` as identifier fails to parse, (i) bare `return` as identifier fails to parse
- [ ] 3.5 Add span coverage in `parser.spans.test.ts` for `FunDef`, `ReturnStmt`, and `Call` nodes (span covers the whole construct, mirroring how `IfStmt` / `WhileStmt` spans are tested)

## 4. Bytecode

- [ ] 4.1 In `compiler/bytecode.ts`: **rename** `LOAD` → `LOAD_G` and `STORE` → `STORE_G` in the `Instruction` union. Update doc comments to clarify these access the VM-level globals map (used by `__main` only after this change)
- [ ] 4.2 Add `{ opcode: "LOAD_L"; name: string }` with a doc comment noting it pushes the value of the named local from the **current** frame's locals map; compile-time guarantees the name is bound
- [ ] 4.3 Add `{ opcode: "STORE_L"; name: string }` with a doc comment noting it pops one value and stores it under `name` in the current frame's locals map (creates the binding if not present)
- [ ] 4.4 Add `{ opcode: "CALL"; fnIndex: number; argc: number }` with a doc comment noting it pops `argc` values, allocates a new frame for `module.functions[fnIndex]`, binds each parameter name to its argument, and transfers control. Operand-stack net effect after RETURN: `-argc + 1` (args consumed, return value pushed)
- [ ] 4.5 Add `{ opcode: "RETURN" }` with a doc comment noting it pops one value, pops the current frame, and pushes that value onto the caller's operand stack
- [ ] 4.6 Define and export `FunctionProto { name: string; params: readonly string[]; code: Instruction[] }` and `BytecodeModule { main: FunctionProto; functions: readonly FunctionProto[] }` in `compiler/bytecode.ts` (or a sibling `module.ts` if it grows; prefer one file for now). `__main` is a `FunctionProto` with `params: []` stored in `module.main`, NOT at `module.functions[0]`
- [ ] 4.7 Update existing VM tests in `vm/run.test.ts` and compiler tests in `compiler/compiler.test.ts` that reference `LOAD`/`STORE` opcode strings to use `LOAD_G`/`STORE_G` (mechanical rename; operand shape is unchanged — still `{ name: string }`)

## 5. Compiler — two-pass and function bodies

- [ ] 5.1 Change `compile(program)` to return `BytecodeModule` instead of `Instruction[]`. Top-level statements emit into `module.main.code`; each `FunDef` emits into a per-function `FunctionProto.code`
- [ ] 5.2 Implement **pass 1**: walk top-level statements; for each `FunDef`, allocate a `FunctionProto` with `params: [...funDef.params]` and an empty `code`; register `name → fnIndex` in a `functionTable: Map<string, number>`; reject duplicate names with `duplicate function: <name>`
- [ ] 5.3 Implement **pass 2**: walk top-level statements again. For each non-`FunDef` statement, emit into `module.main.code` using existing `emitStmt` machinery (with `LOAD_G`/`STORE_G` for global access). For each `FunDef`, switch emission target and compile the body
- [ ] 5.4 Inside a function body's compile context, track a `knownLocals: Set<string>` seeded with every parameter name from `funDef.params`. When the compiler processes an `Assign` to a name not in the set, add it. The set is purely a compile-time check ("is this name a valid local read?"); the VM doesn't need it
- [ ] 5.5 Inside a function body, the `PriExp_var` lowering checks `knownLocals.has(name)`. On hit, emit `LOAD_L name`. On miss, throw a compile error `unknown name: <name>` (do NOT fall back to globals)
- [ ] 5.6 Inside a function body, the `Assign` lowering: add the name to `knownLocals` if absent, then emit `STORE_L name`. Never emit `STORE_G` inside a function
- [ ] 5.7 Inside any function body, `Call` lowering: look up `name` in `functionTable`. On miss, throw `unknown function: <name>`. On hit, retrieve `proto.params.length` as the callee's arity; if `args.length !== arity`, throw `arity mismatch: <name> expects N arguments, got M`. Otherwise, emit each argument expression in order, then `CALL fnIndex argc`
- [ ] 5.8 At top level, `Call` lowering uses the same path as 5.7 (same function table, same arity check). This unifies call compilation across `__main` and function bodies
- [ ] 5.9 Add an `inFunction` flag to the compile context (true during pass-2 emission of a function body, false in `__main`). `ReturnStmt`: if `inFunction === false`, throw `return outside of a function`. If `value` is present, compile the expression then emit `RETURN`. If `value` is absent, emit `PUSH 0; RETURN`
- [ ] 5.10 Add a `controlDepth` counter (incremented when entering `IfStmt` or `WhileStmt` body, decremented on exit). When emitting a `FunDef`, require `inFunction === false && controlDepth === 0`; otherwise throw `def is only allowed at the top level`
- [ ] 5.11 After compiling each function body, append the epilogue `PUSH 0; RETURN` unconditionally (simplest implementation; harmless when the body unconditionally returns earlier)
- [ ] 5.12 `__main` still ends with `HALT` (existing behavior); user functions never emit `HALT`
- [ ] 5.13 Add compiler unit tests in `compiler.test.ts` for: (a) a minimal `def add(a, b) return a + b end` producing the expected bytecode `LOAD_L "a"`, `LOAD_L "b"`, `ADD`, `RETURN` plus the `PUSH 0; RETURN` epilogue; (b) a function with a local assignment (`def f(a) x = a + 1 return x end`) emits `LOAD_L "a"`, `PUSH 1`, `ADD`, `STORE_L "x"`, `LOAD_L "x"`, `RETURN`; (c) two-pass forward reference where `f` calls `g` defined later; (d) the full compile-error surface: duplicate def, return outside fn, def inside if/while/def, unknown name inside fn (including a name that exists as a global), unknown function call, arity mismatch (too few + too many)

## 6. VM — frame stack

- [ ] 6.1 In `vm/run.ts`, replace the single `ip` / `bindings` model with: `globals: Map<string, number>` (for `__main`), `frames: CallFrame[]` (typed `{ proto: FunctionProto; ip: number; locals: Map<string, number> }`), and the existing `OperandStack`
- [ ] 6.2 Change `run(module, options?)` to take a `BytecodeModule`. Initialize by pushing a single frame for `module.main` with `ip = 0` and an empty `locals` map (main never executes `LOAD_L`/`STORE_L`, but giving every frame the same shape keeps the dispatch loop uniform)
- [ ] 6.3 Replace the top-level `while` loop with a frame-aware fetch-execute loop. Each tick reads the top frame's `proto.code[ip]`, advances that frame's `ip`, and dispatches on the instruction
- [ ] 6.4 Implement `LOAD_G name` against `globals` (throws `UndefinedVariable` on miss, unchanged behavior)
- [ ] 6.5 Implement `STORE_G name` against `globals` (unchanged behavior, new name)
- [ ] 6.6 Implement `LOAD_L name` against `frames[top].locals.get(name)`. The compiler guarantees the name is bound before any read, so a miss here is an internal error (defensive `UndefinedVariable` or a dedicated `Error` is acceptable; the path should be unreachable from valid compiler output)
- [ ] 6.7 Implement `STORE_L name` via `frames[top].locals.set(name, pop())`
- [ ] 6.8 Implement `CALL fnIndex argc`: check `frames.length >= maxFrameDepth` and throw `FrameStackOverflow` if exceeded. Pop `argc` values off the operand stack into an array `args` such that `args[0]` is the FIRST argument (reverse pop order, since the last value pushed before CALL is the rightmost argument). Allocate a fresh `locals = new Map<string, number>()`. For `i` in `0..argc-1`, call `locals.set(proto.params[i], args[i])`. Push a new `CallFrame { proto, ip: 0, locals }`
- [ ] 6.9 Implement `RETURN`: pop the return value off the operand stack. Pop the current frame. Push the return value onto the operand stack (now visible to the caller). When the popped frame was the main frame, end execution (same effect as HALT): return either the popped return value or the previously documented "stack empty → undefined" behavior — pick whichever keeps the existing integration test contract stable (see task 7.x)
- [ ] 6.10 `HALT` remains valid only when executing in the main frame; if reached anywhere else, throw a runtime error `HALT outside of main frame` (defensive; the compiler never emits it elsewhere)
- [ ] 6.11 Add a `maxFrameDepth: number` field to `RunOptions` with a default of `1024` (parallel to `maxStackDepth`)
- [ ] 6.12 Add `FrameStackOverflow extends VmError` in `vm/errors.ts` with a clear message and a `limit` field, parallel to `StackOverflow`

## 7. VM tests

- [ ] 7.1 Add direct VM tests in `vm/run.test.ts` for `CALL` / `RETURN` using hand-built `BytecodeModule` fixtures (no compiler involvement): (a) a no-arg function (`params: []`) returning a constant, (b) a single-arg function `params: ["x"]` that doubles its argument via `LOAD_L "x"`, (c) recursion using a tiny module that calls itself a fixed number of times
- [ ] 7.2 Add direct VM tests for `LOAD_L` / `STORE_L` against a hand-built frame: assert that `STORE_L "x"` followed by `LOAD_L "x"` round-trips a value; assert that two frames with the same local name `"x"` see independent values (push frame 1, set `x = 1`, CALL into frame 2, set `x = 99` in frame 2, RETURN, confirm caller's `x` is still `1`)
- [ ] 7.3 Add a frame-depth-cap test: a hand-built module whose main keeps pushing CALLs to itself; run with `maxFrameDepth: 4` and assert `FrameStackOverflow` is thrown
- [ ] 7.4 Add a test asserting `maxStackDepth` and `maxFrameDepth` are independent: a program that exceeds frames but not operand stack throws `FrameStackOverflow`, not `StackOverflow`

## 8. Integration tests

All integration tests live in `integration.test.ts` and exercise the full pipeline (`parse` → `compile` → `run`). Prefer `test.each([...])` tables (matching the style of the existing `evalExpr(%s) === %s` table) over many similar standalone tests; use named `test("…", () => {…})` blocks for kitchen-sink scenarios with assertions on multiple side effects.

- [ ] 8.1 Add a parametrised `test.each` table for **simple calls** covering: no-arg call returning a constant, single-arg call (identity, double, square), multi-arg call (`add(a, b)`, `min(a, b)` implemented with `if`), and calls used inside arithmetic (`1 + double(x) * 2`). At least 8 rows
- [ ] 8.2 Implement recursive **factorial** as a small fixture string at the top of the file and parametrise with `test.each` over inputs: `fact(0) === 1`, `fact(1) === 1`, `fact(2) === 2`, `fact(5) === 120`, `fact(10) === 3628800`. Single shared program source, one compile, run per input — verifies recursion depth and base-case handling
- [ ] 8.3 Implement recursive **fibonacci** (naive double-recursion: `if n < 2 return n end return fib(n - 1) + fib(n - 2)`) as a fixture and parametrise with `test.each` over `[0, 1, 2, 3, 5, 8, 10, 15]` against the known sequence `[0, 1, 1, 2, 5, 21, 55, 610]`. This exercises deep recursion (`fib(15)` performs ~1973 calls) and validates the frame stack under realistic load
- [ ] 8.4 Implement **iterative fibonacci** (using `while`, no recursion) as a separate fixture and parametrise with the same input table as 8.3, asserting identical results. Sanity check that recursion and iteration agree
- [ ] 8.5 Implement **mutual recursion** as `def even(n) ... odd(n - 1) end` / `def odd(n) ... even(n - 1) end` and parametrise with `test.each` over `[(0, 1), (1, 0), (2, 1), (7, 0), (10, 1), (11, 0)]` asserting `even(n)` returns the expected parity bit
- [ ] 8.6 Implement **GCD** (Euclid's algorithm, recursive: `if b == 0 return a end return gcd(b, a - (a / b) * b) end` — note: integer mod via `a - (a/b)*b` since the calculator has only `/`) and parametrise with `test.each` over `[(12, 8, 4), (100, 75, 25), (17, 5, 1), (270, 192, 6)]`. Tests recursion with two parameters and conditional early return
- [ ] 8.7 Add a `test.each` table for **isolated scope and locals**: each row is a `(source, expected)` pair covering — (a) `x = 10\ndef f() x = 5 return x end\ny = f()\nx + y` → `15` (top-level `x` unchanged), (b) two functions with locals named the same don't interfere, (c) parameters shadow nothing because functions can't see top-level (`x = 99\ndef f(x) return x + 1 end\nf(4)` → `5`), (d) reassigning a parameter is just another local store (`def f(a) a = a * 2 return a end\nf(7)` → `14`)
- [ ] 8.8 Add a `test.each` table for **return semantics**: (a) implicit `return 0` — `def f() x = 1 end\nf()` → `0`, (b) bare `return` — `def f() return end\nf()` → `0`, (c) early `return` from `if` — `def abs(x) if x < 0 return -x end return x end` applied to `-3, 0, 7` → `3, 0, 7`, (d) `return` from inside `while` — `def firstEven(start) while 1 if start * start - (start / 2) * 2 == 0 return start end start = start + 1 end end` (or similar), parametrised over a couple inputs
- [ ] 8.9 Add a `test.each` table for **call-in-expression positions**: (a) call as RHS of assignment, (b) call as condition of `if`, (c) call as condition of `while`, (d) call as argument to another call, (e) nested call `outer(inner(2), 3)`, (f) call composed with arithmetic and comparison `add(1, 2) > sub(10, 5)`
- [ ] 8.10 Add a single named **kitchen-sink** integration test (one `test("kitchen sink: …", ...)` block, like the existing one) that defines several functions (e.g. `square`, `sumTo`, `fib`), uses both recursion and iteration, mixes local assignments with top-level globals, exercises early returns, and asserts a single final value. Modelled on the existing `kitchen sink: all features in one script` test
- [ ] 8.11 Add a parametrised `test.each` table for **compile errors**: each row is `(source, expectedErrorSubstring)` and the test uses `expect(() => evalExpr(source)).toThrow(expected)`. Cover at minimum: nested `def` inside `if`, nested `def` inside `while`, nested `def` inside another `def`, `return` at top level, `return` inside `if` at top level, unknown function in call, unknown name inside fn body that exists at top level (proves no fallback), arity too few, arity too many, duplicate `def` of same name
- [ ] 8.12 Add a runtime-error test for **frame overflow** in integration: compile and run a recursive program (e.g. `fib(50)`) with a tight `maxFrameDepth: 10` and assert `FrameStackOverflow` is thrown
- [ ] 8.13 Add a single regression test that re-runs the **entire existing `test.each` table** (arithmetic, comparison, logical ops, assignment, `if`/`else`, `while`, `break`, `continue`) and asserts identical results after this change — easiest done by leaving the existing table in place and confirming it still passes. No new code; this is just a checklist item to verify the renames/refactor didn't break anything

## 9. Quality gate

- [ ] 9.1 Run `yarn ohm:bundles` one more time and verify no diff (grammar bundle is consistent with the `.ohm` source)
- [ ] 9.2 Run `yarn lint && yarn typecheck && yarn test` and fix any failures before finishing
- [ ] 9.3 Update `sketchbook/calculator/README.md` to mark the "Functions" line as complete
