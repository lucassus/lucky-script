## Why

The sketchbook pipeline (`grammar.ohm` → `parse()` → tree-walking `evaluate()`) is a good surface for experimenting with language syntax, but it hides how real runtimes lower programs to instructions, manage call frames, and implement control flow. A bytecode compiler and stack VM on the same sketchbook AST gives a concrete, readable learning path for recursion and branching without touching the production `Lexer` / `Parser` / `Interpreter` pipeline.

## What Changes

- Add a new sketchbook backend under `sketchbook/vm/`: `parse()` → `compile()` → `run()`
- Represent bytecode as structured `Instruction` records (human-readable; optional disassembler)
- Implement a number-only stack VM with globals, per-frame locals, and name-indexed `CALL` (no closures in v1)
- Support a fibonacci-shaped v1 subset of the sketchbook AST:
  - `Program`, `Let`, `Assign`, `ExprStmt`
  - `FunDef`, `Return`, `Call`
  - `If` with optional `else` (no `elseif` in v1)
  - arithmetic: `+`, `-`, `*`, `/`
  - comparisons: `<`, `==`
  - literals: numbers (booleans/null compile to `0`/`1` only when encountered; v1 tests focus on numeric programs)
- Reject unsupported AST nodes at compile time with clear errors (`elseif`, `%`, `^`, `and`/`or`/`not`, extra comparisons, unary ops, etc.)
- Add layered tests: compile golden fixtures, per-opcode VM tests, and parity with `evaluate()` on supported programs
- Keep `evaluate()` unchanged as the reference backend for the sketchbook

## Capabilities

### New Capabilities

- `micro-vm`: Compile the sketchbook AST to structured stack bytecode and execute it on a call-frame VM with a fibonacci-shaped v1 instruction subset

### Modified Capabilities

- None

## Impact

- **New modules**: `sketchbook/vm/opcodes.ts`, `bytecode.ts`, `compile.ts`, `vm.ts`, `disasm.ts` and colocated tests
- **Existing sketchbook code**: `parse.ts` and `grammar.ts` unchanged; VM consumes `parse()` output
- **Testing**: fibonacci parity table and compile golden tests added under `sketchbook/vm/`
- **Compatibility**: no breaking change to sketchbook syntax or `evaluate()` semantics; unsupported constructs fail only on the VM path
- **Risk**: semantic drift between `evaluate()` and VM; mitigated by parity tests on the v1 subset and explicit compile-time rejection of unsupported nodes
