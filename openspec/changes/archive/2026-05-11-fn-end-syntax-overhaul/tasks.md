## 1. Reference Grammar (lark-sandbox)

- [x] 1.1 Update `lark-sandbox/lucky_script.lark`: replace `function` with `fn`, `{}` blocks with `end`, add `then`/`elseif`/`in` keywords, remove required parens around conditions, add short-form anonymous function rule, add `end` as block closer
- [x] 1.2 Update `lark-sandbox/lucky_script_test.py`: rewrite all test cases from `function`/`{}`/parenthesized conditions to `fn`/`end`/newline-or-then syntax
- [x] 1.3 Run `cd lark-sandbox && make test` — all tests green

## 2. Lexer — Token changes

- [x] 2.1 In `src/Lexer/Token.ts`: add `Keyword.Fn`, `Keyword.End`, `Keyword.Then`, `Keyword.ElseIf`, `Keyword.In`; remove `Keyword.Function`; rename `Delimiter.End` to `Delimiter.Eof`; remove `Delimiter.LeftBrace` and `Delimiter.RightBrace`
- [x] 2.2 In `src/Lexer/Lexer.ts`: remove `{`/`}` tokenization cases; update EOF token creation to use `Delimiter.Eof`
- [x] 2.3 Add Lexer tests: `fn` recognized as keyword, `end` recognized as keyword, `then` recognized as keyword, `elseif` recognized as keyword, `in` recognized as keyword, `function` tokenized as identifier, `{` and `}` produce errors or are no longer valid tokens
- [x] 2.4 Run `yarn test Lexer` — all tests green

## 3. Parser — Core syntax changes

- [x] 3.1 In `src/Parser/Parser.ts`: rewrite `block()` to consume `end` instead of `}`, handling empty blocks (`fn foo() end`) and multi-statement bodies
- [x] 3.2 Update `functionDeclaration()`: consume `Keyword.Fn` instead of `Keyword.Function`
- [x] 3.3 Update `anonymousFunction()`: consume `Keyword.Fn` instead of `Keyword.Function`
- [x] 3.4 Update `ifStatement()`: remove required `(`/`)` around condition, accept newline or `then` as condition terminator, handle `elseif` keyword as flat chain, use `end`-based block
- [x] 3.5 Update `elseBody()`: handle `elseif` keyword, remove `else if` two-keyword path
- [x] 3.6 Update `whileStatement()`: remove required `(`/`)` around condition, accept newline or `then` as condition terminator, use `end`-based block
- [x] 3.7 Add short-form anonymous function parsing: after `fn(params)`, if next token is on same line (not newline), parse one expression as body with implicit return flag; if newline, fall through to full form
- [x] 3.8 Ensure named functions always use full form (newline after params + `end`)
- [x] 3.9 Reject `end` after short-form lambda (parse error)
- [x] 3.10 Update `AstNode.ts` if needed: add `implicitReturn` flag to `FunctionDeclaration` for short-form lambdas, or represent short-form body as a single return statement at parse time

## 4. Parser — Tests

- [x] 4.1 Update `src/Parser/Parser.test.ts`: rewrite all function, if, while tests from `function`/`{}`/parens to `fn`/`end`/newline-or-then syntax
- [x] 4.2 Add parser tests for `then` keyword (single-line if, single-line while)
- [x] 4.3 Add parser tests for `elseif` keyword (single `end`, flat chain, reject `else if`)
- [x] 4.4 Add parser tests for short-form lambda: `fn(x) x * 2`, `fn(a, b) a + b`, as callback argument
- [x] 4.5 Add parser error tests: `end` after short form, named function with short form, statement in short form, braces rejected, missing `end`
- [x] 4.6 Add parser tests for empty body: `fn foo()\nend`, `fn foo() end`
- [x] 4.7 Run `yarn test Parser` — all tests green

## 5. Interpreter — Short-form implicit return

- [x] 5.1 In `src/Interpreter/Interpreter.ts`: handle `FunctionDeclaration` nodes with implicit return flag — if set, the last (only) expression in the body SHALL be returned automatically without requiring `return` keyword
- [x] 5.2 Add interpreter tests for short-form lambda return behavior: `fn(x) x * 2` called returns `6`, full form without `return` returns `nothing`
- [x] 5.3 Run `yarn test Interpreter` — all tests green
- [x] 6.1 Update all tests in `src/Interpreter/Interpreter.test.ts` from old syntax to new syntax
- [x] 6.2 Update all integration tests in `src/examples/` from old syntax to new syntax
- [x] 6.3 Run `yarn test` — all tests green

## 7. Final quality check

- [x] 7.1 Run `yarn lint && yarn typecheck && yarn test` — all pass with no failures
