# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Version-specific detail**

- **v1 (archived):** [`src/v1/AGENTS.md`](src/v1/AGENTS.md) — hand-written lexer/parser and AST interpreter; no new features.
- **v2 (current):** [`src/v2/AGENTS.md`](src/v2/AGENTS.md) — Ohm grammar, compiler, bytecode VM; default target for language work.

## Commands

```bash
yarn install              # install deps
yarn test                 # run all tests
yarn test Lexer           # run tests matching pattern (Vitest substring match)
yarn lint                 # eslint
yarn typecheck            # tsc --noEmit (see tsconfig.typecheck.json)
yarn build                # compile to dist/
ts-node src/v1/repl.ts    # interactive REPL (legacy v1 interpreter)
```

## Philosophy

Lucky Script is a personal learning project. No one uses it in production systems, and it should not be used in production systems. Breaking changes to the language syntax or semantics are fine — don't let backward compatibility concerns block good design decisions.

## Quality

After any code change, run `yarn lint`, `yarn typecheck`, and `yarn test`. Fix all failures before finishing.

## Repository shape

Two implementations live side by side:

| Tree | Role |
|------|------|
| **`src/v1/`** | Legacy **hand-crafted** pipeline (lexer + recursive-descent parser + AST-walking interpreter). **Archived** — no new features; see [`src/v1/AGENTS.md`](src/v1/AGENTS.md). |
| **`src/v2/`** | **Current** stack: Ohm-generated lexer/parser, **compiler** to bytecode, **VM** execution. See [`src/v2/AGENTS.md`](src/v2/AGENTS.md). |
| **`src/sketchbook/`** | Experiments and calculators; keep edits small and task-scoped unless asked. |

Ohm grammars use generated bundles. After editing any `*.ohm` under `src/`:

```bash
ohm generateBundles --withTypes 'src/**/*.ohm'
```

## Where to work

- **New syntax, semantics, or runtime behavior:** follow [`src/v2/AGENTS.md`](src/v2/AGENTS.md) (default).
- **Mechanical fix in legacy code only:** follow [`src/v1/AGENTS.md`](src/v1/AGENTS.md).
- **Final check (always):** `yarn lint && yarn typecheck && yarn test`.
