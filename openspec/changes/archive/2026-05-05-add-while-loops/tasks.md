## 1. Lexer: Add while keyword

- [x] 1.1 Add `while` keyword test to `Lexer.test.ts`
- [x] 1.2 Implement `while` keyword in `Keyword` enum and `Keyword.fromString()`
- [x] 1.3 Run `yarn test Lexer` and verify tests pass

## 2. Parser: Add WhileStatement AST node

- [x] 2.1 Add `WhileStatement` AST node type to `AstNode.ts`
- [x] 2.2 Add while loop parse tests to `Parser.test.ts`
- [x] 2.3 Implement `whileStatement()` parse method in `Parser.ts`
- [x] 2.4 Add while case to `statement()` method to dispatch to `whileStatement()`
- [x] 2.5 Run `yarn test Parser` and verify tests pass

## 3. Interpreter: Add while loop execution

- [x] 3.1 Add unit tests for while loop execution to `Interpreter.test.ts` (basic loop, nested loops, return statement in loop)
- [x] 3.2 Implement `visitWhileStatement()` method in `Interpreter.ts`
- [x] 3.3 Add integration test examples (e.g., countdown loop, factorial via while loop, early return from loop)
- [x] 3.4 Run `yarn test Interpreter` and verify tests pass

## 4. Examples & documentation

- [x] 4.1 Create integration test example file `src/examples/while-loops.test.ts` (e.g., countdown, factorial, sum)
- [x] 4.2 Update `README.md`: add while loop section with example code
- [x] 4.3 Update README features list to include while loops
- [x] 4.4 Update README "Planned features" to move while from planned to implemented (if desired)

## 5. Quality checks

- [x] 5.1 Run `yarn lint` and fix any issues
- [x] 5.2 Run `yarn typecheck` and fix any type errors
- [x] 5.3 Run `yarn test` (full test suite) and verify all tests pass
- [x] 5.4 Test while loops in the REPL: `ts-node src/repl.ts`

## 6. Documentation & archive

- [x] 6.1 Verify changes match specs requirements
- [x] 6.2 Run `openspec archive add-while-loops` to finalize the change
