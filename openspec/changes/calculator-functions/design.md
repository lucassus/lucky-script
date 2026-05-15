## Context

The calculator sketchbook today is a single-frame stack VM:

- Parser produces `Program = readonly Stmt[]`.
- Compiler emits a flat `Instruction[]` with a single instruction pointer.
- VM runs that array with one `OperandStack` and one `Map<string, number> bindings`.
- Variable accesses are name-keyed (`LOAD`/`STORE` carry strings).
- Control flow is forward-only jumps (`JMP`, `JMP_IF_ZERO`) inside the same instruction array.

Adding functions requires multiple compiled code blocks, a saveable execution state (so a call can pause its caller and return later), and a way to keep callee locals from leaking into the caller. The natural shape is **per-function bytecode** + a **frame stack**.

The relevant prior art in this repo is `openspec/changes/micro-vm/design.md`, which makes parallel decisions for the OLDER sketchbook AST (not the calculator). This design intentionally mirrors several of those choices (name-indexed calls, slot-indexed locals, structured `Instruction` records) while differing where the calculator's existing shape demands it (one shared instruction array per function, isolated scope inside fns rather than fallback-to-globals).

## Goals / Non-Goals

**Goals:**

- `def name(params) <nl> body <nl> end` at top level only.
- `return [expr]` inside a function body; `return` outside any function is a compile error.
- Call expressions: `name(arg, arg, ...)` usable anywhere `AssignExp` is allowed.
- Functions are **not first-class values**. They live in a separate, name-indexed namespace.
- Inside a function: **isolated scope**. Reads of unknown names → compile error. All writes allocate or update a local slot. No access to top-level (`__main`) bindings.
- Implicit `return 0` at the end of every function body (zero analysis required).
- Two-pass compile so recursion and mutual recursion just work.
- Frame-based VM with a `maxFrameDepth` cap.
- Preserve the observable behavior of every existing calculator program that does not use the new syntax.

**Non-Goals:**

- First-class function values (`f = otherFn`, passing functions as args, higher-order functions). Closures are explicitly excluded.
- Nested function definitions (no `def` inside `if`/`while`/another `def`).
- Function expressions / anonymous functions.
- Default arguments, varargs, named arguments, keyword arguments.
- A separate value type for `nil` / `undefined`. Missing-return is `0`; we may revisit later.
- Changes to the production Lucky Script lexer/parser/interpreter.
- Changes to the `micro-vm` sketchbook (different AST, different directory).

## Decisions

### D1: Surface syntax

**Choice:** Grammar additions:

```
Stmt           += FunDef | ReturnStmt
FunDef          = def_kw ident "(" Params? ")" nl+ Block end_kw
ReturnStmt      = return_kw AssignExp?
Params          = ident ("," ident)*
PriExp_call     = ident "(" Args? ")"   -- inserted BEFORE PriExp_var
Args            = AssignExp ("," AssignExp)*

def_kw    = kw<"def">
return_kw = kw<"return">
keyword  += def_kw | return_kw
```

`PriExp_call` must precede `PriExp_var` in the alternation so Ohm matches the longer call form when `ident "("` is present. `ReturnStmt`'s expression is optional; `return` alone is legal and means "return 0."

**Alternatives:**

- `function name() ... endfunction` (Lua/MATLAB-style) — chosen `def`/`end` for terseness and consistency with the existing block style.
- Disallow bare `return` (require an expression) — rejected; bare `return` is idiomatic for early exit and pairs naturally with the implicit-`0` rule.

**Rationale:** Smallest grammar delta. Reuses the existing `Block` production verbatim, so the body is just statements. `Args` matches typical `(a, b, c)` shape without trailing-comma edge cases.

### D2: Top-level only `def`

**Choice:** `FunDef` is a top-level statement only. Nested `def` (inside `if`/`while`/another `def` body) is a **compile-time** error (not a parse error). Grammar admits `FunDef` everywhere `Stmt` is admitted, but the compiler asserts `inFunction === false && loopDepth === 0 && controlDepth === 0` and rejects otherwise.

**Alternatives:**

- Grammar-level restriction: introduce a `TopStmt` non-terminal that excludes `FunDef` from nested `Block`s. Adds grammar surface and breaks the uniformity that "a `Block` is a list of `Stmt`s." Rejected for now.
- Allow nested defs and make them act like top-level (i.e. hoisted to the module). Confusing semantics in the presence of "no closures." Rejected.

**Rationale:** Keeps grammar simple. Compile-time error message can be precise: `def is only allowed at the top level`.

### D3: Functions are not first-class values

**Choice:** Function names live in a **separate namespace** from variables. The compiler maintains a `Map<string, number> functionTable` mapping `name → fnIndex`. A bare identifier (`PriExp_var`) only resolves to a variable; `PriExp_call` (`ident "(" ... ")"`) only resolves to a function. The two namespaces never compete.

If a `def` and a variable share a name, both are allowed (e.g. `def foo() ... end` and `foo = 5` may coexist). `foo` (bare) reads the variable; `foo()` calls the function. This is a small footgun, accepted in v1.

**Alternatives:**

- Same namespace with collision error. More user-friendly but introduces an ordering question (does declaration order matter?). Rejected as needless friction for a sketchbook.
- First-class function values. Requires a tagged `Value` type throughout the VM, doubles the operand-stack surface, and adds a runtime type-check on every arithmetic opcode. Rejected per explore-mode discussion; deferred to a future "introduce values" change.

**Rationale:** Smallest model that supports recursion and call frames. Matches `micro-vm` D5.

### D4: Two-pass compilation

**Choice:** `compile(program)` runs two passes over `program: readonly Stmt[]`:

1. **Pass 1 — register defs.** Walk top-level statements. For each `FunDef`, allocate a `FunctionProto` with `name`, `arity = params.length`, and an empty `code: Instruction[]`. Register `name → fnIndex` in the function table. Duplicate `def` of the same name → compile error.
2. **Pass 2 — emit code.** Walk top-level statements again. For each non-`FunDef` statement, emit into `__main`. For each `FunDef`, switch the emission target to that proto's `code` and compile its body.

**Alternatives:**

- Single pass with pending-call patches. Works but adds bookkeeping for forward calls. Rejected as more complex.
- Require source-order declaration before use. Excludes mutual recursion and most idiomatic recursive examples. Rejected.

**Rationale:** Recursion and mutual recursion both work without patching. Forward references are natural.

### D5: Isolated scope inside functions

**Choice:** Each function-body compile context tracks a **known-locals set** `Set<string>` containing the names that are visible inside that body. The set is seeded with the parameter names from the `def`. Inside a function body:

- Reads (`PriExp_var`): the compiler checks the known-locals set. Miss → compile error `unknown name: <name>`. Hit → emit `LOAD_L <name>`.
- Writes (`Assign`): the compiler adds the name to the set if not already present, then emits `STORE_L <name>`. There is no fallback to globals.
- Top-level (`__main`) code uses `LOAD_G <name>` / `STORE_G <name>` against the global bindings (same as today's `LOAD` / `STORE`, just renamed).

**Alternatives:**

- Slot-indexed locals (`LOAD_L slot` / `STORE_L slot`) backed by a `number[]` in each frame. More "real-VM"-shaped (matches JVM, Wasm, etc.) and is what the `micro-vm` sketchbook plans to do. Trades ~20 lines of compiler bookkeeping (slot table, slot counter, `localCount`, `localNames` debug list) for marginally faster lookup. Rejected for the calculator: same call-frame architecture is taught either way, but name-keyed locals are simpler and produce more readable bytecode in tests. Slot indexing will return naturally with closures (upvalue capture wants stable slot positions).
- Globals fallback inside functions (Python/JS-ish). Discussed and rejected: cleaner story for "no closures," easier to teach, no hoisting subtlety.

**Rationale:** Each function is a self-contained sandbox of locals over a shared operand stack. The compiler tracks "is this name known?" as a Set; the VM tracks "what is its current value?" as a Map. The two opcode families (`_G` / `_L`) are perfectly symmetric — same operand shape (a `name: string`), different storage container. The only "leakage" from outer scope is intentional: functions can call other functions (because the function table is module-wide, not part of any frame).

### D6: Implicit `return 0` epilogue

**Choice:** After compiling each function body (pass 2), unconditionally emit the epilogue:

```
PUSH 0
RETURN
```

No analysis of whether every path already returns. If a path falls through, the epilogue runs. If every path returned earlier, the epilogue is dead code (harmless).

Bare `return` (no expression) compiles to `PUSH 0; RETURN` as well.

**Alternatives:**

- Control-flow analysis to require `return` on every path. Real work for marginal benefit at this stage. Rejected.
- Runtime "function did not return a value" error. Requires a sentinel value; we have none.

**Rationale:** Simplest possible thing. Matches Lua's "missing return is fine, you get `nil`" except our `nil` is `0`. Trivial to upgrade later if we add a real `nil`.

### D7: `return` outside a function

**Choice:** Compiler tracks `inFunction: boolean` (set by entering pass-2 emission for a `FunctionProto`, cleared when returning to `__main`). Encountering a `ReturnStmt` while `inFunction === false` → compile error `return outside of a function`. Mirrors how `break` / `continue` already check `loopDepth === 0`.

**Rationale:** Catches the obvious bug at compile time. No runtime cost.

### D8: Bytecode shape

**Choice:** Rename existing global ops and add new ops:

```
LOAD_G name    STORE_G name    # was LOAD/STORE; access globals
LOAD_L name    STORE_L name    # new; access current frame's locals
CALL fnIndex argc              # new; both operands compile-time constants
RETURN                         # new; consumes one value from operand stack
```

`PUSH`, `POP`, `DUP`, arithmetic (`ADD`/`SUB`/`MUL`/`DIV`), comparison (`GT`/`LT`/...), `NOT`/`NEG`, `JMP`/`JMP_IF_ZERO`, and `HALT` are unchanged.

All four `LOAD`/`STORE` variants carry the same operand shape: `{ name: string }`. The `_G` / `_L` suffix selects the storage container (globals map vs. current frame's locals map) — there is no `_G` / `_L` ambiguity within a single function body, because the compiler decides which suffix to emit based on whether it is currently inside `__main` or a function body.

**Alternatives:**

- Keep `LOAD`/`STORE` overloaded with a "scope" field. Less greppable, more conditional in the VM. Rejected.
- Slot-indexed locals (`LOAD_L slot` / `STORE_L slot`). Standard for production stack VMs and matches the planned `micro-vm` sketchbook. Trades ~20 lines of compiler bookkeeping for marginally faster lookup; rejected for this calculator change in favor of symmetry with `LOAD_G`/`STORE_G` and more readable bytecode in tests. See D5 for the full rationale.

**Rationale:** Minimal additions, perfectly symmetric global/local pair, no overloaded opcodes. Bytecode disassembly reads naturally: `STORE_L "x"` is immediately understandable without an aux table.

### D9: Bytecode container

**Choice:** `compile()` returns a `BytecodeModule`, not a flat `Instruction[]`:

```typescript
interface FunctionProto {
  readonly name: string;
  readonly params: readonly string[];   // parameter names in declaration order
  readonly code: Instruction[];
}

interface BytecodeModule {
  readonly main: FunctionProto;    // synthesized "__main"; params: []
  readonly functions: readonly FunctionProto[];  // user-defined, indexed by CALL.fnIndex
}
```

`arity` is derivable as `params.length` and is not stored separately. `__main` is kept as a dedicated field (not at `functions[0]`) so `CALL fnIndex` never accidentally invokes `__main`. The function table is **only** user defs.

Note: there is no `localCount` or `localNames` field because locals are name-keyed in a `Map<string, number>` per frame (see D5 and D11). The `params` list is the only thing CALL needs at runtime — to map each popped argument to its parameter name when populating the new frame's locals map.

**Alternatives:**

- `functions[0] = __main`. Slightly simpler but allows nonsense like `CALL 0 0` to re-enter main. Rejected.
- Stay flat (one big `Instruction[]` with embedded function headers and jump-over). Conflates concerns and makes the VM harder to reason about. Rejected.
- Store `arity: number` alongside `params: string[]`. Redundant; `params.length` suffices.

**Rationale:** Clear separation between "what the program is" (module) and "what the VM does" (run frames). Tests can inspect any function's code independently.

### D10: Statement-position calls and stack discipline

**Choice:** Every call leaves exactly **one** value on the operand stack (the return value or implicit `0`). Statement-position calls (`f(1, 2)` alone on a line) parse as `ExprStmt(Call(...))`, and the existing `ExprStmt` rule applies — the value is `POP`ped if the call is not the program's final statement.

The implicit-return rule (D6) is what makes this clean: there's no "void" call to worry about.

**Rationale:** Reuses the existing stack-discipline logic. No new "is this call a statement?" branch needed.

### D11: VM frame layout

**Choice:**

```typescript
interface CallFrame {
  readonly proto: FunctionProto;
  ip: number;                              // index into proto.code
  readonly locals: Map<string, number>;    // name-keyed, populated on CALL
}

class VM {
  readonly operandStack: OperandStack;        // shared across frames
  readonly frames: CallFrame[];               // stack; top is currently executing
  readonly globals: Map<string, number>;      // for __main, populated by STORE_G
  readonly maxFrameDepth: number;             // default 1024
}
```

`run(module, options?)` starts by pushing a frame for `module.main` (with an empty `locals` map; main never executes `LOAD_L`/`STORE_L`) and runs until the main frame returns or HALTs.

`LOAD_L` / `STORE_L` always access the **current frame's** `locals` map (`frames[frames.length - 1].locals`). `LOAD_G` / `STORE_G` always access the VM's shared `globals` map. The two maps never compete because the compiler chooses which opcode to emit based on whether it is compiling `__main` or a function body.

**CALL semantics:**

1. Pop `argc` values off the operand stack in reverse declaration order (so the **last** popped value is `arg 1`, the **first** popped value is `arg N`).
2. Check `frames.length >= maxFrameDepth` → `FrameStackOverflow`.
3. Resolve `proto = module.functions[fnIndex]`. (Compile-time guarantees this index exists.)
4. Allocate a fresh `locals: Map<string, number>`. For each `i` in `0..argc-1`, set `locals.set(proto.params[i], args[i])`.
5. Push the new `CallFrame { proto, ip: 0, locals }`.

**RETURN semantics:**

1. Pop the return value off the operand stack.
2. Pop the current frame.
3. Push the return value back onto the operand stack (the caller's frame is now active).
4. The caller's `ip` is unchanged from CALL's emission point — it already advanced past CALL during the fetch on the caller's last tick before we switched frames, so execution naturally resumes at the instruction after CALL.

**HALT semantics:** Only meaningful in `main`. If reached inside a callee (shouldn't happen given the compiler always emits epilogues), treat as runtime error `HALT outside of main frame`.

**Alternatives:**

- Per-frame operand stack. More isolation but doubles the work, and standard stack VMs share. Rejected.
- `number[]` slot-indexed locals. See D5 / D8 rejection rationale; the calculator chooses name-keyed for simplicity and symmetry.

**Rationale:** Standard textbook stack-VM frame layout, with the storage container chosen for readability. Sharing the operand stack is conventional and makes argument passing trivial (push args, CALL, RETURN pops args and leaves result). Each frame is a self-contained namespace; there is no chance of leakage because `LOAD_L` is hardcoded to read the current frame.

### D12: Frame depth cap

**Choice:** Add a `maxFrameDepth` option to `RunOptions`, defaulting to `1024`. Exceeding it throws `FrameStackOverflow`. Keep the existing `maxStackDepth` (operand stack cap) unchanged.

**Alternatives:**

- Rely on JS recursion limit. We run iteratively, so there is no JS recursion limit to lean on. Rejected.
- Unify the two caps. Different concepts (data vs control). Rejected.

**Rationale:** Catches infinite recursion at a clear boundary with a clear error class. Test-friendly (smoke test sets a tiny cap and asserts the error).

### D13: Error surface

**Choice:** Add two new error families:

- **Compile errors** (existing `Error` from `compiler.ts`, no new class needed):
  - `def is only allowed at the top level`
  - `return outside of a function`
  - `duplicate function: <name>`
  - `unknown function: <name>` (call to a name not in the function table)
  - `unknown name: <name>` (read of an undeclared local inside a function)
  - `arity mismatch: <name> expects N arguments, got M` (compile-time, since arity is known)
- **Runtime errors** (new subclasses in `vm/errors.ts`):
  - `FrameStackOverflow extends VmError` — thrown when `maxFrameDepth` is exceeded.

Existing `UndefinedVariable` (for `LOAD_G` of an undeclared global at runtime) stays. It can still fire if `__main` reads a name that was never written.

**Rationale:** Compile-time catches everything we statically know. Runtime adds only the one new family it needs.

### D14: Test layering

**Choice:** Three layers, following the project's existing convention:

1. **Parser** (`parser.test.ts`, `parser.spans.test.ts`): AST shape and span coverage for `def`, `return`, and call expressions. Includes failure cases (`def` / `return` as identifiers).
2. **Compiler** (`compiler.test.ts`): golden bytecode for minimal `def` programs, two-pass behavior (forward calls, recursion, mutual recursion), and the full compile-error surface from D13.
3. **VM** (`run.test.ts`): per-opcode unit tests for `CALL`, `RETURN`, `LOAD_L`/`STORE_L`. Frame depth cap test with a tiny `maxFrameDepth`.
4. **Integration** (`integration.test.ts`): end-to-end programs. Must include:
   - Simple `def add(a, b) return a + b end; add(2, 3)` → `5`.
   - Recursion: `fact(5)` → `120`.
   - Mutual recursion: `def even(n) ... end; def odd(n) ... end; even(10)` → `1`.
   - Statement-position call: `def side(x) end; side(7); 42` → `42` (call's `0` is `POP`ped).
   - Implicit return: `def f() x = 1 end; f()` → `0`.
   - Bare `return`: `def f() return end; f()` → `0`.
   - Early return: `def abs(x) if x < 0 return -x end return x end; abs(-3)` → `3`.

## Risks / Trade-offs

- **Bytecode renaming churn.** `LOAD`/`STORE` → `LOAD_G`/`STORE_G` is a breaking change to the `Instruction` union. Mitigation: the sketchbook calculator has no external consumers; all test fixtures live in this repo and will be updated as part of the change.
- **Two same-named bindings (`def foo` + variable `foo`)** can confuse readers. Mitigation: documented in D3 as accepted v1 behavior; future changes can tighten this.
- **No closures means common functional idioms don't work.** Trying to pass `add` as a value gives a confusing "unknown name" or parse error rather than "functions aren't values yet." Mitigation: error messages can be specific (`<name> is a function and cannot be used as a value`). Tracked as future work, not blocking.
- **Module shape change (`BytecodeModule` instead of `Instruction[]`)** ripples to `run.ts` signature. Mitigation: keep `run` taking a module and update the integration helper accordingly. The disassembly story stays straightforward.
- **Frame stack overflow vs operand stack overflow** are now two separate failure modes. Mitigation: distinct error classes (`FrameStackOverflow`, `StackOverflow`) with clear messages.

## Migration Plan

Greenfield behavior inside `sketchbook/calculator/`. No data migration. Rollback = revert the change; no external state to clean up.

Internal rollout steps:

1. Grammar + parser (small AST additions; verify with parser tests).
2. Bytecode opcode additions and rename of `LOAD`/`STORE`; update all existing compiler/VM tests that hardcode opcode names.
3. Compiler two-pass refactor and emission.
4. VM frame-stack refactor.
5. Integration tests for recursion, mutual recursion, early return, etc.
6. Quality gate: `yarn lint && yarn typecheck && yarn test`.

## Open Questions

- Should the compile-time arity check produce a span-anchored error pointing at the call site? The current calculator compile errors are plain `Error` instances without spans. Adopting span-anchored errors here would set a pattern for the rest of the compiler. Not blocking; resolve during implementation.
