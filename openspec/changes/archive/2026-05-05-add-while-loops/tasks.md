## 1. Lark sandbox grammar

- [x] 1.1 Add `while` smoke tests (valid: parens+braces, empty body, nested; invalid: missing parens, missing braces, `while` as identifier) to `lark-sandbox/lucky_script_test.py`
- [x] 1.2 Add `while_statement` rule and `| while_statement` alternative to `statement` in `lark-sandbox/lucky_script.lark`
- [x] 1.3 Run `cd lark-sandbox && make test && make lint`; resolve failures

## 2. Lexer

- [x] 2.1 Add `Keyword.While = new Keyword("while")` to `src/Lexer/Token.ts`
- [x] 2.2 Add a Lexer test asserting that the source `while` tokenizes to `Keyword.While` (not `Literal.Identifier`) in `src/Lexer/Lexer.test.ts`
- [x] 2.3 Run `yarn test Lexer`; resolve failures

## 3. Parser — AST node

- [x] 3.1 Add `WhileStatement` class to `src/Parser/AstNode.ts` with `condition: Expression` and `body: Statement[]` fields, mirroring `IfStatement`'s shape
- [x] 3.2 Export `WhileStatement` from `src/Parser/index.ts` if needed for consumers (not needed — `IfStatement` isn't either; consumers import from `Parser/AstNode`)

## 4. Parser — recognition

- [x] 4.1 In `src/Parser/Parser.test.ts`, add tests covering: basic while, empty body, nested while, while with condition expression (e.g. `i < 3`), missing parens raises `SyntaxError`, missing braces raises `SyntaxError`, `while` cannot be used as identifier
- [x] 4.2 In `src/Parser/Parser.ts`, dispatch `Keyword.While` from `statement()` to a new `whileStatement()` method that consumes `while`, `(`, `expression()`, `)`, then calls `block()`, returning a `WhileStatement` node
- [x] 4.3 Run `yarn test Parser`; resolve failures

## 5. Interpreter — visitor

- [x] 5.1 In `src/Interpreter/Interpreter.test.ts`, add unit tests covering: false condition skips body (counter stays at 0), counter loop increments to terminating value, `toBoolean()` coercion of non-boolean condition, empty body terminates, while statement evaluates to `LuckyNothing`, scope behavior (assignment inside body persists after loop), `return` inside body exits enclosing function
- [x] 5.2 In `src/Interpreter/Interpreter.ts`, import `WhileStatement` and add an `instanceof` branch to `visit()` that dispatches to a new `visitWhileStatement(node)` method
- [x] 5.3 Implement `visitWhileStatement` with a JS-level `while` loop that re-evaluates `node.condition` via `this.visit(...).toBoolean()`, executes each body statement via `this.visit(statement)`, and returns `LuckyNothing.Instance`
- [x] 5.4 Verify (no code change) that `Return` thrown inside the body propagates upward through the JS-level `while` to `visitFunctionCall`'s catch block — covered by the test from 5.1
- [x] 5.5 Run `yarn test Interpreter`; resolve failures

## 6. Integration test

- [x] 6.1 Create `src/examples/whileLoop.test.ts` exercising the canonical mutating-condition pattern (e.g., a counter from 0 to N, a sum-of-1-to-N loop, a while inside a function that early-returns)
- [x] 6.2 Run `yarn test whileLoop`; resolve failures

## 7. Documentation

- [x] 7.1 In `TODOs.md`, mark the `while` line as `[x]` (the `break / continue` follow-up entry is already present)
- [x] 7.2 Update `README.md` if it documents language constructs, adding a brief `while` example consistent with the existing `if` example

## 8. Final quality gate

- [x] 8.1 Run `yarn lint`; resolve failures
- [x] 8.2 Run `yarn typecheck`; resolve failures
- [x] 8.3 Run `yarn test`; resolve failures
