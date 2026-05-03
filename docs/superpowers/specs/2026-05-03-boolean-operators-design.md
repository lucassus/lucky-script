# Boolean Operators Design: `and` / `or` / `not`

**Date:** 2026-05-03
**Feature:** Boolean operators + boolean literals

---

## Overview

Add `and`, `or`, `not` operators and `true`/`false` literals to Lucky Script. Required before `while` loops can express meaningful conditions.

---

## Tokens

Five new keywords added to `Keyword` enum in `src/Lexer/Token.ts`:

```
Keyword.True   → "true"
Keyword.False  → "false"
Keyword.And    → "and"
Keyword.Or     → "or"
Keyword.Not    → "not"
```

`Keyword.fromString()` already handles discovery automatically via the `values` array.

---

## AST

One new node class (`BooleanLiteral`). Extend existing union types:

**`src/Parser/AstNode.ts`**

- `BinaryOperator` gains `"and" | "or"`
- `UnaryOperator` gains `"not"`
- New `BooleanLiteral` node:

```ts
export class BooleanLiteral extends Expression {
  constructor(public readonly value: boolean) {
    super();
  }
}
```

---

## Operator Precedence

From lowest to highest among boolean + comparison operators:

| Level | Operator | Associativity |
|-------|----------|---------------|
| 1 (lowest) | `or` | left |
| 2 | `and` | left |
| 3 | `not` | right (unary) |
| 4 | `<` `<=` `==` `!=` `>` `>=` | left |
| 5+ | arithmetic, power, unary `+`/`-` | (unchanged) |

Consequences:
- `a or b and c` → `a or (b and c)` — `and` binds tighter
- `not a and b` → `(not a) and b` — `not` binds tighter than `and`
- `not a or b` → `(not a) or b`
- `not (a and b)` — requires explicit brackets

**Brackets** already work — the existing `group()` rule in `atom()` handles `(expr)` with no changes needed.

---

## Parser

**`src/Parser/Parser.ts`**

`binaryOperation()` signature widens from `Operator[]` to `TokenType[]` — one-line change, enables keywords as binary operators.

New precedence levels inserted above `comparison`:

```
expression → orExpression → andExpression → notExpression → comparison → ...
```

- `orExpression`: `binaryOperation(andExpression, [Keyword.Or])`
- `andExpression`: `binaryOperation(notExpression, [Keyword.And])`
- `notExpression`: if current token is `Keyword.Not`, consume and return `UnaryOperation("not", notExpression())` recursively; otherwise fall through to `comparison`

`expression()` calls `orExpression()` instead of `comparison()` directly.

`atom()` gains:

```ts
if (currentToken.type === Keyword.True) {
  this.consume(Keyword.True);
  return new BooleanLiteral(true);
}
if (currentToken.type === Keyword.False) {
  this.consume(Keyword.False);
  return new BooleanLiteral(false);
}
```

---

## Interpreter

**`src/Interpreter/Interpreter.ts`**

`visitBinaryOperation` cannot eagerly evaluate both sides for `and`/`or` — short-circuit requires lazy right-side evaluation. Handle before the existing `const right = this.visit(node.right)` line:

```ts
if (node.operator === "and") {
  const left = this.visit(node.left);
  return left.toBoolean() === LuckyBoolean.False ? LuckyBoolean.False : this.visit(node.right).toBoolean();
}
if (node.operator === "or") {
  const left = this.visit(node.left);
  return left.toBoolean() === LuckyBoolean.True ? LuckyBoolean.True : this.visit(node.right).toBoolean();
}
```

`visitUnaryOperation` gains:

```ts
case "not":
  return LuckyBoolean.fromNative(value.toBoolean() === LuckyBoolean.False);
```

`visit()` dispatches `BooleanLiteral` to new `visitBooleanLiteral`:

```ts
private visitBooleanLiteral(node: BooleanLiteral): LuckyBoolean {
  return LuckyBoolean.fromNative(node.value);
}
```

**Truthiness rules (`toBoolean()` impls):**

| Type | Rule |
|------|------|
| `LuckyBoolean` | returns `this` (already implemented) |
| `LuckyNumber` | `0` → `False`, all others (including negatives) → `True` |
| `LuckyNothing` | always `False` |
| `LuckyFunction` | always `True` |

---

## Files Changed

| File | Change |
|------|--------|
| `src/Lexer/Token.ts` | Add `True`, `False`, `And`, `Or`, `Not` to `Keyword` |
| `src/Parser/AstNode.ts` | Add `BooleanLiteral`; extend `BinaryOperator` and `UnaryOperator` |
| `src/Parser/Parser.ts` | Widen `binaryOperation` param; add `orExpression`, `andExpression`, `notExpression`; update `expression`, `atom` |
| `src/Interpreter/Interpreter.ts` | Add `BooleanLiteral` dispatch; add `and`/`or` short-circuit; add `not` unary case |
| `src/Interpreter/objects/LuckyNumber.ts` | Implement `toBoolean()` |
| `src/Interpreter/objects/LuckyNothing.ts` | Implement `toBoolean()` |
| `src/Interpreter/objects/LuckyFunction.ts` | Implement `toBoolean()` |

---

## Tests

Integration tests to add (alongside existing tests):

```ts
// Boolean literals
true         → true
false        → false

// not
not true     → false
not false    → true
not 0        → true
not 1        → false
not -1       → false   // negative numbers are truthy

// and
true and true    → true
true and false   → false
false and true   → false
1 and 2          → true   // both non-zero truthy

// or
false or true    → true
false or false   → false
0 or false       → false  // both falsy
-1 or 0          → true   // first operand truthy, short-circuits

// precedence: comparison binds tighter than and/or
true and false == false   → true

// short-circuit: right side must not evaluate when not needed
false and f()    → false  // f() never called (test by making f throw)
true or f()      → true   // f() never called
```

---

## Verification

`yarn lint && yarn test` must stay green after each file change.
