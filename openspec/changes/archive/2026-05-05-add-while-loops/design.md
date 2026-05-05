## Context

Lucky-script uses a three-stage pipeline: Lexer → Parser → Interpreter. The language follows a philosophy where **only function calls create scopes** — control flow structures (if/else) execute in the enclosing scope. While loops should follow this same pattern to be consistent with the language design.

The parser currently uses recursive descent with one-token lookahead. The interpreter is a tree-walking visitor pattern.

## Goals / Non-Goals

**Goals:**
- Add while loop syntax: `while (condition) { body }`
- Loop body executes in the enclosing scope (no child scope creation)
- Variables created in loop body are visible after loop exits
- Loop condition is re-evaluated each iteration

**Non-Goals:**
- Break/continue statements (future feature)
- Loop labels or named loops
- Infinite loop detection or timeout protection
- Do-while loops

## Decisions

**1. Scope handling: Loop body executes in enclosing scope**
- Loop body is NOT a scope boundary (no `isFunctionBoundary` flag)
- Variables assigned in the loop are visible in the enclosing scope
- Consistent with if/else statement behavior
- Rationale: Keeps the language simple — only functions create scopes. Alternative would be to create loop-local scope, but that breaks Python-style loop variable semantics and adds complexity.

**2. Lexer: Add `while` keyword**
- Keyword addition only, no new token types needed
- Integrates into existing `Keyword` enum and `Keyword.fromString()` logic

**3. Parser: New `WhileStatement` AST node and parse rule**
- AST: `WhileStatement { condition: Expression, body: Statement }`
- Parse rule: `while_statement = WHILE LPAREN expression RPAREN statement`
- Parser already handles block statements (`{ ... }`), so body can be block or single statement
- No operator precedence changes needed (while is not an expression)

**4. Interpreter: New `visitWhileStatement()` method**
- Loop: evaluate condition → if truthy, execute body → repeat
- Condition coerced to boolean using `isTruthy()` (existing utility)
- Body executed in enclosing scope via `visit(statement)` (no scope creation)
- Return value: `LuckyNothing` (loops don't produce values)

## Risks / Trade-offs

**[Risk] Infinite loops with no exit mechanism**
→ Mitigation: Future features (break/continue) can address this. For now, users must write explicit exit conditions. This is acceptable for a learning language.

**[Risk] Loop variable scope semantics surprise users**
→ Mitigation: Document that loop variables leak to enclosing scope (Python-style). This is intentional and enables closure capture in for-loops (future feature).

## Migration Plan

- No deployment or rollback needed — changes are additive
- Tests will verify both the happy path and edge cases
