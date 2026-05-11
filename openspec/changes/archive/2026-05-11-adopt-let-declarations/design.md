## Context

Lucky Script currently separates write intent across three forms: bare assignment, `local`, and `outer`. This design is explicit but introduces language-specific rules that differ from declaration-first languages and increases parser/interpreter branching for assignment behavior. The proposed change moves the language to a declaration-required model centered on `let`.

## Goals / Non-Goals

**Goals:**
- Replace `local` with a familiar declaration keyword (`let`) while preserving lexical scoping.
- Remove special write-path keywords from runtime semantics and define a single reassignment rule.
- Make assignment errors explicit when a name has not been declared in any reachable scope.
- Keep closure mutation viable through nearest-binding reassignment.

**Non-Goals:**
- Introduce immutability in this change (`const` remains future work).
- Add block scope for `if`/`while`/`for` (function calls remain the only scope-creating construct).
- Provide backwards-compatibility shims for `local`/`outer`.

## Decisions

1. Declaration-first model using `let`
   - Decision: `let name = expr` is the only declaration form in this change.
   - Rationale: aligns with user expectation from modern languages and clarifies when new bindings are created.
   - Alternative considered: keep `local` as an alias for one release; rejected to avoid dual-syntax complexity.

2. Reassignment updates nearest existing binding
   - Decision: `name = expr` and compound assignment operators mutate the nearest lexical scope that already defines `name`.
   - Rationale: removes the need for `outer` while keeping closure-state updates natural.
   - Alternative considered: keep current local-only bare assignment; rejected because it conflicts with declaration-first expectations.

3. Undeclared assignment is a runtime error
   - Decision: if no existing binding is found for assignment (including top-level assignment), evaluation fails with `NameError` naming the variable.
   - Rationale: prevents accidental variable creation and encourages explicit declaration.
   - Alternative considered: implicitly create a local binding on first assignment; rejected due to hidden shadowing and typo risk.

4. Lexer/parser remove `local` and `outer`
   - Decision: keywords `local` and `outer` are removed from grammar; `let` is added.
   - Rationale: language surface should match runtime semantics and avoid dead concepts.
   - Alternative considered: keep `outer` as an optional explicit escape hatch; rejected for initial simplification.

5. Frozen builtins remain non-writable
   - Decision: reassignment traversal must not mutate the frozen builtins scope.
   - Rationale: preserves interpreter safety guarantees and existing builtin immutability.
   - Alternative considered: allow reassignment to builtins if found; rejected as unsafe and surprising.

## Risks / Trade-offs

- [Migration breakage] Existing scripts using `local`/`outer` stop parsing -> Mitigation: update README, provide migration examples, and include parser error messaging that suggests `let`.
- [Refactor sensitivity] Nearest-binding reassignment can change behavior if a new nearer declaration is introduced -> Mitigation: strengthen tests around shadowing and closure mutation.
- [Error model churn] Runtime failures may move from silent local creation to explicit errors -> Mitigation: add focused tests for undeclared assignment at top level and in nested functions.
- [Interpreter complexity shift] Assignment logic moves from mode-dispatch to scope-search logic -> Mitigation: keep reassignment in a dedicated SymbolTable path with unit tests.

## Migration Plan

1. Add `let` keyword and parsing path.
2. Update AST binding model to represent declaration vs reassignment (and remove `outer`/`local` modes).
3. Replace symbol-table write APIs with declaration and nearest-binding reassignment APIs.
4. Update interpreter assignment evaluation and compound-assignment behavior.
5. Replace tests and examples that use `local`/`outer`.
6. Update documentation and language reference for the new scoping model.

Rollback strategy: revert parser/interpreter keyword and assignment changes together; partial rollback is unsafe because syntax and runtime semantics are tightly coupled.

## Open Questions

- Should a short deprecation window exist where `local` parses with an error hint instead of immediate hard removal?
