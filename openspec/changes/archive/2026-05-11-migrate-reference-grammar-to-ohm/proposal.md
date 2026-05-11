## Why

The project keeps a lightweight **reference grammar** alongside the handwritten TypeScript lexer and parser so syntax can be checked without running the interpreter. Maintaining a separate Python-based grammar and test harness was extra work. Migrating this role to **`ohm-js`**, already a project dependency, gives one Node-based story for grammar POCs while keeping production parsing in TypeScript.

## What Changes

- Add a **production Ohm grammar** at `src/grammar.ohm` as the canonical reference surface-syntax description (**intentionally minimal**: **LF-only** statement breaks, **ASCII spaces** only in Ohm `space`—no **`;`** or **`\t`** in the grammar even though the interpreter lexer may accept them).
- Add a **loader module** at `src/grammar.ts` that resolves the `.ohm` path relative to **`__dirname`** and exports the parsed `ohm.Grammar`. **No semantic actions, no toy interpreter** — this milestone is syntax-only.
- Add **Vitest smoke tests** at `src/grammar.test.ts`: edge-case parametrized cases ported from the former Python smoke tests, an **explicit numeric-literal micro-spec**, plus one **kitchen-sink** script covering current constructs.
- Add **`src/simplified/json.ohm`** (and tests) as an isolated POC grammar beside the existing simplified playground.
- Add **probe tests in `src/Lexer/Lexer.test.ts`** for two known parity concerns surfaced while writing the Ohm grammar — **token-boundary discipline** (keywords vs identifiers) and **string escape surface** (Lucky's restricted escape set vs Ohm-default). These tests are written to characterize current behavior; **if they fail, they are left failing for a follow-up change** (no Lexer fixes in this PR).
- Update **documentation** (`README.md`, top-level `CLAUDE.md`/`AGENTS.md`, `roadmap.md`): reference grammar lives in Ohm; remove Python-grammar workflow directions.
- **Remove** every project reference to the old Python sandbox: that directory, its CI workflow, the `eslint.config.js` ignore entry, and matching docs (**BREAKING** for contributors who relied on Python in CI or local grammar iteration).

## Capabilities

### New Capabilities

- `reference-grammar`: Requirements for the Ohm Lucky Script grammar (parity targets, lexical/statement rules scope, loader contract) and for automated syntax smoke verification.

### Modified Capabilities

- (none — language semantics unchanged; TS lexer/parser remain authoritative for execution.)

## Impact

- **Code**: New `src/grammar.ohm`, `src/grammar.ts`, `src/grammar.test.ts`; new `src/simplified/json.ohm` + tests; new probe tests in `src/Lexer/Lexer.test.ts` (may be left failing intentionally).
- **Deleted**: Python sandbox tree; Python grammar GitHub Actions workflow; `eslint.config.js` sandbox ignore entry.
- **Dependencies**: Uses existing `ohm-js`; removes implicit dependency on Python for reference grammar CI.
- **Docs**: Grammar-first TDD in `AGENTS.md`/`CLAUDE.md` updated to Vitest + Ohm paths; `roadmap.md` and `README.md` reworded.
