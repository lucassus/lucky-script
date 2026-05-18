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

Colocated `*.test.ts` under `parser/`, `compiler/`, `vm/`. Broad coverage: **`integration.test.ts`**.

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
