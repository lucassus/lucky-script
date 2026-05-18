# Lucky Script v2 (current)

Uses **ohm-js**: lexer and parser are driven from **`parser/grammar.ohm`** (generated **`grammar.ohm-bundle`**). Pipeline: **parse → compile → VM** — see root [`AGENTS.md`](../../AGENTS.md). For the legacy interpreter stack, see [`src/v1/AGENTS.md`](../v1/AGENTS.md).

## Layout (under `src/v2/`)

```
parser/
  grammar.ohm        # Authoritative surface grammar
  grammar.ohm-bundle.*
  parser.ts          # Ohm semantics → AST
  ast.ts
  testingUtils.ts
compiler/            # AST → bytecode (`compile`, `bytecode`)
vm/                  # Bytecode executor (`run`, stack, environment, errors)
integration.test.ts  # End-to-end parse / compile / run tests
```

## Architecture: Parse (Ohm) → Compile → VM

**Parse**: Match grammar, semantics in `parser/parser.ts`, AST types in `parser/ast.ts`.

**Compile** (`compiler/compiler.ts`): Produces `BytecodeModule` (`compiler/bytecode.ts`).

**Run** (`vm/run.ts`): Operand stack and frames (`vm/Environment`, `OperandStack`), errors in `vm/errors.ts`, values in `vm/value.ts`.

## Tests

Tests live colocated with the layer they exercise. Each file has a distinct responsibility — **do not duplicate positive-path program behavior across layers**, since doing so just couples the suite to internal artifacts (token stream, AST shape, bytecode calling convention) without adding coverage.

| File | Responsibility |
|------|----------------|
| `parser/parser.test.ts`, `parser/parser.spans.test.ts` | Grammar shape, AST construction, source-span reporting, parse errors. Asserts on AST nodes, not on program results. |
| `compiler/compiler.test.ts` | Bytecode emitted for representative AST shapes, compile-time errors (e.g. `unknown name`, `return outside of a function`). Asserts on instruction lists, not on runtime values. |
| `vm/Environment.test.ts`, `vm/OperandStack.test.ts` | Unit-level invariants of the runtime data structures (chain walking, push/pop bounds, etc.). |
| `vm/run.test.ts` | **VM-only edge cases** — runtime errors (`StackUnderflow`, `NotCallable`, `ArityMismatch`, `UndefinedVariable`, …), resource limits (`StackOverflow`, `FrameStackOverflow`), and opcode semantics that the surface language cannot conveniently express (e.g. `DIV` by zero, `NaN` comparisons, `MAKE_CLOSURE` capture-by-reference, cross-kind `EQ`). Built from hand-crafted `Bytecode` literals. **Not** for happy-path programs. |
| `integration.test.ts` | End-to-end behavior of real Lucky programs through the full parse → compile → run pipeline. **This is where positive-path tests for any language feature belong** (`def`, `let`, `while`, recursion, closures, comparisons, control flow, …). |

Rule of thumb: if a test could be written by feeding a string source to `run()`, it belongs in `integration.test.ts`. Bytecode-level tests in `vm/run.test.ts` should only exist for behavior the compiler does not (or cannot) emit, or for failure modes that are awkward to provoke from source.

## Development workflow (preferred for language work)

Prefer **v2** whenever behavior or syntax should evolve.

### 1 — Grammar (syntax changes)

1. Edit `parser/grammar.ohm`; extend `parser/parser.test.ts` and `parser/parser.spans.test.ts` when behavior or source spans change.
2. Regenerate bundles and types:  
   `ohm generateBundles --withTypes 'src/**/*.ohm'`
3. Run `yarn test v2/parser` (or full `yarn test`).

### 2 — Implementation (TDD)

Typical layer order:

1. **Parser / AST** — `parser/*.test.ts`, `parser.ts`, `ast.ts`.
2. **Compiler** — `compiler/compiler.test.ts`, `compiler.ts`, `bytecode.ts`.
3. **VM** — `vm/*.test.ts`, opcodes / execution in `run.ts` and related modules.
4. **Integration** — extend `integration.test.ts`.

### 3 — Quality

`yarn lint && yarn typecheck && yarn test` (same as root [`AGENTS.md`](../../AGENTS.md)).
