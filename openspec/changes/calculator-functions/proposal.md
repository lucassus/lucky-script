## Why

The sketchbook calculator (`sketchbook/calculator/`) covers expressions, variables, and structured control flow, but every program lives in a single flat scope with a single instruction pointer. Adding user-defined functions is the next step both for the calculator as a small language and for the learning trajectory: it exercises **call frames**, **local variable slots**, **recursion**, and a **stack of execution contexts** in the VM — concepts that the rest of the project (e.g. `openspec/changes/micro-vm`) is also building toward.

## What Changes

- Extend the calculator Ohm grammar with **function definitions** (`def name(params) <nl> body <nl> end`), **return statements** (`return [expr]`), and **call expressions** (`ident "(" Args? ")"`).
- Reserve `def` and `return` as keywords.
- Extend the calculator AST with `FunDef`, `ReturnStmt`, and `Call` nodes.
- Use a **two-pass compiler**: pass 1 scans top-level `def`s and registers each `name → fnIndex` so recursion and mutual recursion work without forward-declaration. Pass 2 compiles bodies into per-function bytecode.
- Inside a function body, **all variable resolution is isolated to that function's locals** — reads of an unknown name are a compile error, and assignments always allocate or update a local slot. Functions cannot read or write top-level (`__main`) bindings.
- Add bytecode opcodes for the new model: `LOAD_L slot`, `STORE_L slot`, `CALL fnIndex argc`, `RETURN`. **Rename** the existing global `LOAD`/`STORE` to `LOAD_G`/`STORE_G` for symmetry.
- Restructure the VM around a **stack of `CallFrame`s** (each with its own `ip` and local slot array). The operand stack remains a single shared resource across frames (consistent with stack-VM convention). Add a `maxFrameDepth` runtime option (default `1024`).
- Functions are **not first-class values**: they live in a separate name-indexed namespace. `f = otherFn` and passing functions as arguments are NOT supported. Bare `f` (without parentheses) does not refer to a function.
- Missing `return` falls through to an implicit `return 0` at the end of every function body.
- `return` outside any function is a compile error (mirrors how `break`/`continue` are checked).
- Function definitions are allowed at **top level only**. A `def` nested inside an `if`/`while`/another `def` body is a parse / compile error.
- Add layered tests: grammar, parser, compiler (golden bytecode), VM (per-opcode), integration (recursion, mutual recursion, arity mismatch, return-outside-fn, etc.).

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `sketchbook-calculator`: Add function definitions, return statements, call expressions, two-pass compilation, frame-based VM execution, and the corresponding bytecode and error surface.

## Impact

- **Code**: `sketchbook/calculator/parser/` (`grammar.ohm`, `ast.ts`, `parser.ts`, `parser.test.ts`, `parser.spans.test.ts`), `sketchbook/calculator/compiler/bytecode.ts`, `compiler/compiler.ts`, `compiler/compiler.test.ts`, `sketchbook/calculator/vm/run.ts`, `vm/run.test.ts`, `vm/errors.ts`, `sketchbook/calculator/integration.test.ts`, regenerated `sketchbook/calculator/parser/grammar.ohm-bundle.{js,d.ts}`.
- **Bytecode breaking change** (sketchbook only, no external consumers): existing `LOAD` / `STORE` opcodes are renamed to `LOAD_G` / `STORE_G`. Compiler output for global reads/writes changes shape; any hand-written bytecode fixtures in tests must update.
- **Compatibility**: All existing calculator source programs that do not use `def` / `return` continue to parse, compile, and run with the same observable results.
- **Tooling**: Uses existing `yarn ohm:bundles` script after grammar edits.
- **Risk**: Two-pass compilation and frame-stack VM are larger surface than prior calculator changes; mitigated by layered tests and explicit compile-time rejection of unsupported placements (nested `def`, `return` outside fn).
