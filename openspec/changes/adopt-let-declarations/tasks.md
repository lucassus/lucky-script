## 0. Lark reference grammar alignment

- [ ] 0.1 Add/adjust syntax tests in `lark-sandbox/lucky_script_test.py` for `let` declarations and removal of `local`/`outer`.
- [ ] 0.2 Update `lark-sandbox/lucky_script.lark` to parse the new declaration-first syntax.
- [ ] 0.3 Run `make test` in `lark-sandbox/` and fix grammar test failures.

## 1. Lexer and token model

- [ ] 1.1 Add `let` to keyword recognition and remove `local`/`outer` keyword tokens.
- [ ] 1.2 Update lexer tests to cover `let` tokenization and rejection of removed keywords.

## 2. Parser and AST updates

- [ ] 2.1 Replace `local`/`outer` assignment parse branches with a `let` declaration parse branch.
- [ ] 2.2 Refactor assignment AST representation to distinguish declaration vs reassignment semantics without `outer`/`local` modes.
- [ ] 2.3 Update parser tests for declaration-first syntax and nearest-binding reassignment parse shape.

## 3. Interpreter and scope semantics

- [ ] 3.1 Add SymbolTable APIs for declaration (`let`) and nearest-existing-binding reassignment.
- [ ] 3.2 Enforce runtime error on reassignment when no writable existing binding is found.
- [ ] 3.3 Preserve frozen-builtin protections under the new reassignment traversal.
- [ ] 3.4 Update interpreter and symbol-table unit tests for closure mutation, shadowing, and undeclared-assignment failures.
- [ ] 3.5 Add explicit unit coverage that `let` re-declaration in the same scope rebinds and does not raise an error.

## 4. Integration tests and language examples

- [ ] 4.1 Rewrite variable scoping integration tests from `local`/`outer` syntax to `let` plus nearest-binding reassignment behavior.
- [ ] 4.2 Update all files in `src/examples/*.test.ts` to the `let` declaration-first semantics and remove `local`/`outer` usage.
- [ ] 4.3 Add integration coverage for error cases: undeclared top-level assignment, undeclared inner assignment, and builtin reassignment without declaration.

## 5. Documentation and quality gates

- [ ] 5.1 Update `README.md` scoping and closure sections to describe the `let` model and migration from `local`/`outer`.
- [ ] 5.2 Update `roadmap.md` examples and language notes to replace `local`/`outer` semantics with the `let` declaration-first model.
- [ ] 5.3 Run `yarn lint`, `yarn typecheck`, and `yarn test`; fix failures until all pass.
