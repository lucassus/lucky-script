## 1. Reference grammar (lark-sandbox)

- [ ] 1.1 Add test cases for `local x = e` and `outer x = e` to `lark-sandbox/lucky_script_test.py`
- [ ] 1.2 Update `lark-sandbox/lucky_script.lark` to recognise `local` and `outer` as keywords and to parse the two new assignment forms
- [ ] 1.3 Run `cd lark-sandbox && make test` and confirm all syntax tests pass

## 2. Lexer

- [ ] 2.1 Add tests in `src/Lexer/Lexer.test.ts` covering tokenisation of `local`, `outer`, and their use in assignments
- [ ] 2.2 Add `local` and `outer` to `Keyword` (and any keyword recognition table in `src/Lexer/`) so they tokenise as keywords rather than identifiers
- [ ] 2.3 Run `yarn test Lexer` and confirm green

## 3. Parser

- [ ] 3.1 Add tests in `src/Parser/Parser.test.ts` for parsing `local x = e` and `outer x = e` at top level and inside function bodies
- [ ] 3.2 Extend `VariableAssigment` in `src/Parser/AstNode.ts` with a binding-mode tag (`"bare" | "local" | "outer"`)
- [ ] 3.3 Update `src/Parser/Parser.ts` to recognise the new statement forms and emit the tag
- [ ] 3.4 Run `yarn test Parser` and confirm green

## 4. SymbolTable rework

- [ ] 4.1 Add tests in `src/Interpreter/SymbolTable.test.ts` (create if it does not exist) covering: function-boundary marker, `setLocal`, the new `setBareInsideFunction`/`setOuter` semantics, and frozen-builtins behaviour
- [ ] 4.2 Add an `isFunctionBoundary` flag to `SymbolTable` and a factory/constructor option that creates a function-boundary scope
- [ ] 4.3 Implement the `setOuter(key, value)` operation: walk the chain starting from `parent`, skipping the current function-boundary scope, until a defining scope is found; write there. Throw a runtime error (e.g., a new `ScopeError` or extension of `NameError`) if not found, and refuse to write into the frozen builtins scope.
- [ ] 4.4 Adjust the bare-assignment path so that, when the current scope is a function-boundary scope (or a descendant whose nearest boundary is the current function), the write resolves to `setLocal` on the boundary scope rather than walking past it
- [ ] 4.5 Introduce a frozen builtins scope: a `SymbolTable` (or wrapper) seeded with the entries from `BUILTINS` whose `setLocal`/`set` operations throw. Make the user top-level scope its child.
- [ ] 4.6 Run `yarn test Interpreter` and confirm green

## 5. Interpreter

- [ ] 5.1 Replace the builtins-into-root-scope loop in `Interpreter.ts:33-38` with the frozen builtins scope from task 4.5; the user top-level scope becomes its child
- [ ] 5.2 Update `visitVariableAssigment` to dispatch on the binding-mode tag: `bare` (current-scope-aware: function → local, top-level → top-level), `local` → `setLocal`, `outer` → `setOuter`
- [ ] 5.3 Mark the function-call scope created in `visitFunctionCall` (`Interpreter.ts:174`) as a function boundary
- [ ] 5.4 Remove the `withScope(this.scope.createChild(), ...)` calls in `visitIfStatement` (`Interpreter.ts:307,314`); `if`/`else` bodies now execute in the surrounding scope
- [ ] 5.5 Add unit tests in `src/Interpreter/Interpreter.test.ts` covering: bare write inside fn does not mutate outer; `local` shadows; `outer` mutates and errors when missing; `if`/`while` do not introduce scope; reads still walk the chain; builtins are not mutable; read-before-local sees outer
- [ ] 5.6 Add an integration test in `src/Interpreter/examples/` for a `make_counter` style closure using `local` and `outer`
- [ ] 5.7 Run `yarn test Interpreter` and confirm green

## 6. Loop semantics (`for` / `while`)

- [ ] 6.1 If `for` is not yet implemented at the time of this change, add a placeholder note in `tasks.md` of the loops change to ensure the loop variable is bound in the enclosing scope (function-scoped, leaks after the loop)
- [ ] 6.2 If `while` is implemented in this repo, add a regression test confirming a `while` body assignment is visible after the loop

## 7. Migration & callers

- [ ] 7.1 Search `src/` and `src/Interpreter/examples/` for tests/programs that rely on `x = e` inside a function reaching out to mutate an enclosing `x`; migrate each to `outer x = e`
- [ ] 7.2 Search for tests that rely on overwriting a builtin via assignment (e.g., `print = ...`) and migrate them to `local print = ...` inside a fresh function or remove them if no longer meaningful
- [ ] 7.3 Update `docs/plan-improvements.md` Scoping and Variables sections to match the final rules (resolve the line-67 vs line-187 contradiction and document the `outer` keyword)
- [ ] 7.4 Update `CLAUDE.md` (Interpreter section) to describe scopes-are-function-boundaries and the new `setOuter`/frozen-builtins behaviour

## 8. Final quality gate

- [ ] 8.1 Run `yarn lint`
- [ ] 8.2 Run `yarn typecheck`
- [ ] 8.3 Run `yarn test`
- [ ] 8.4 Verify the change is ready for archive: `openspec validate add-local-and-outer-keywords` (if available) or `openspec status --change add-local-and-outer-keywords`
