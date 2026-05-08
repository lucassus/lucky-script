## 1. Grammar (lark-sandbox)

- [x] 1.1 Add compound assignment tests to `lark-sandbox/lucky_script_test.py`
- [x] 1.2 Update `lark-sandbox/lucky_script.lark` with compound assignment syntax
- [x] 1.3 Run `cd lark-sandbox && make test` to verify grammar

## 2. Lexer

- [x] 2.1 Add compound assignment token types to `src/Lexer/Token.ts` (PlusAssign, MinusAssign, MultiplyAssign, DivideAssign)
- [x] 2.2 Add lexer recognition for `+=`, `-=`, `*=`, `/=` in `src/Lexer/Lexer.ts`
- [x] 2.3 Add tests to `src/Lexer/Lexer.test.ts`
- [x] 2.4 Run `yarn test Lexer`

## 3. Parser

- [x] 3.1 Add `toBinaryOp()` helper to map compound operators to binary operators
- [x] 3.2 Modify `expression()` to detect compound assignment pattern (identifier + compound op)
- [x] 3.3 Implement `compoundAssignment()` method to desugar to simple assignment AST
- [x] 3.4 Modify `localAssignment()` to handle compound operators
- [x] 3.5 Modify `outerAssignment()` to handle compound operators
- [x] 3.6 Add tests to `src/Parser/Parser.test.ts`
- [x] 3.7 Run `yarn test Parser`

## 4. Integration Tests

- [x] 4.1 Add examples in `src/examples/` for compound assignment scenarios
- [x] 4.2 Run `yarn test Interpreter`

## 5. Quality Check

- [x] 5.1 Run `yarn lint && yarn typecheck && yarn test`
- [x] 5.2 Fix all failures
