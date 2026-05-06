# Implementation Plan: While-loop `break` and `continue`

**Branch**: `001-while-break-continue` | **Date**: 2026-05-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-while-break-continue/spec.md`

## Summary

Add `break` and `continue` as reserved keywords usable inside `while` loop bodies. `break` exits the innermost enclosing loop; `continue` skips the rest of the current iteration and re-evaluates the loop condition. Misuse outside a loop — including placement inside a function literal that is itself nested in a loop — is rejected at parse time with a message that names the offending statement. The runtime semantics reuse the existing throw-and-catch control-flow pattern that already implements `return`.

Implementation touches three layers:

1. **Lexer**: add `Keyword.Break` and `Keyword.Continue` to the keyword table; tokenization is otherwise unchanged.
2. **Parser**: add `BreakStatement` / `ContinueStatement` AST nodes; introduce a `loopDepth` counter that increments around `while` bodies and is saved/reset/restored around function literal bodies (named or anonymous); reject `break`/`continue` when `loopDepth === 0`.
3. **Interpreter**: add `Break` and `Continue` subclasses of `ControlFlow`; `visitWhileStatement` catches them — `Break` exits the while loop normally, `Continue` aborts the current iteration's body traversal and falls back to the condition test.

The lark reference grammar is updated in lockstep so the syntax sandbox accepts the new forms and rejects the negative cases.

## Technical Context

**Language/Version**: TypeScript 6.0.3 targeting Node (ESM via ts-node).
**Primary Dependencies**: none at runtime; dev only — Vitest 4.1.5 (test), ESLint 10.3.0 (lint), Prettier 3.8.3 (format), Lark (Python, sandbox-only via uv).
**Storage**: N/A (in-process interpreter).
**Testing**: Vitest for the TypeScript pipeline (unit tests colocated with source, integration tests under `src/examples/`); pytest+Lark for the grammar sandbox.
**Target Platform**: Node.js (developer-machine CLI/REPL only).
**Project Type**: compiler/interpreter — single TypeScript project with a Python/Lark grammar sandbox alongside.
**Performance Goals**: not measured; the interpreter is a teaching project. Constraint: zero regression in existing test runtime.
**Constraints**: no new runtime dependencies; the existing throw-based control-flow style (`Return`) must be reused for `Break`/`Continue` to preserve uniformity. Parser must reject `break`/`continue` outside a loop *before* execution begins.
**Scale/Scope**: ~3 affected source files in `src/Lexer`, `src/Parser`, `src/Interpreter` plus tests; one grammar file plus its test in `lark-sandbox/`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution at `.specify/memory/constitution.md` is the unfilled template (placeholders such as `[PRINCIPLE_1_NAME]`). No project-specific principles or gates have been ratified, so there is nothing concrete to gate against. The only universal quality bar that applies is the one in `CLAUDE.md`: after any code change, `yarn lint`, `yarn typecheck`, and `yarn test` must all pass; any grammar change must additionally pass `cd lark-sandbox && make test`.

**Initial gate**: PASS (no constraints defined).
**Post-design gate**: PASS — the design adds new nodes and signal classes alongside existing ones rather than refactoring core abstractions, and introduces no new tools or dependencies.

## Project Structure

### Documentation (this feature)

```text
specs/001-while-break-continue/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 decisions (this run)
├── data-model.md        # Phase 1 entities (this run)
├── quickstart.md        # Phase 1 quickstart (this run)
├── contracts/           # Phase 1 grammar + error contracts
│   ├── grammar.md
│   └── errors.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created here)
```

### Source Code (repository root)

```text
lark-sandbox/
├── lucky_script.lark              # add break_statement / continue_statement to `statement`
└── lucky_script_test.py           # add valid + invalid syntax cases for break / continue

src/
├── Lexer/
│   └── Token.ts                   # add Keyword.Break, Keyword.Continue
├── Parser/
│   ├── AstNode.ts                 # add BreakStatement, ContinueStatement (no fields)
│   ├── Parser.ts                  # add loopDepth tracking; parse new statements; reject misuse
│   └── Parser.test.ts             # parse-time success + parse-time error cases
├── Interpreter/
│   ├── ControlFlow.ts             # add Break, Continue (extend ControlFlow, no payload)
│   ├── Interpreter.ts             # visit Break/Continue nodes; catch in visitWhileStatement
│   └── Interpreter.test.ts        # runtime semantics (single + nested loops)
└── examples/
    └── breakContinue.test.ts      # integration test covering acceptance scenarios
```

**Structure Decision**: Single TypeScript project (no monorepo). The lark sandbox in `lark-sandbox/` continues to act as the spec for the surface grammar — it is updated first, then the TypeScript implementation is brought into agreement.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations — table left empty.
