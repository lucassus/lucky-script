## Why

Lucky Script currently executes only through the tree-walking interpreter. That is excellent for language iteration, but it hides how real runtimes work internally. Adding a tiny stack VM path gives a concrete learning vehicle for bytecode design, call frames, jumps, and recursion while preserving the current interpreter as the reference backend.

The goal is educational clarity, not production performance. The first version should be intentionally narrow.

## What Changes

- Add a new `tiny-core` backend: AST -> bytecode compiler -> stack VM executor
- Keep the existing interpreter unchanged and available as the semantic reference
- Support only a strict tiny subset of the language in VM v1:
  - numbers
  - variable assignment/access
  - named functions and function calls
  - recursion
  - `if` / `else`
  - `return`
  - arithmetic: `+`, `-`, `*`
  - comparisons: `<`, `==`
- Explicitly reject unsupported AST features in compiler with clear errors (e.g. strings, loops, closures, anonymous functions)

## Capabilities

### New Capabilities

- `tiny-core-vm`: Compile a tiny subset of Lucky Script AST to bytecode and execute it on a stack-based VM

### Modified Capabilities

- None

## Impact

- **New modules**: compiler and VM packages (instruction definitions, chunk/prototype model, frame model, runtime loop)
- **Testing**: add backend-parity tests for tiny-core-compatible scripts (e.g. recursive fibonacci, factorial, simple branching)
- **Developer ergonomics**: optional helper to run script through VM backend in tests
- **Compatibility**: no breaking language change; unsupported constructs fail only when using VM backend
- **Risk**: semantic drift between interpreter and VM; mitigated by shared tests over tiny-core subset
