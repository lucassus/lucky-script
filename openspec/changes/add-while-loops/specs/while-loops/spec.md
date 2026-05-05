## ADDED Requirements

### Requirement: `while` statement syntax

The parser SHALL recognize a `while` statement of the form `while "(" expression ")" block`, where `block` is the same brace-delimited statement list used by `if` and function bodies. `while` SHALL be a reserved keyword and MUST NOT be usable as an identifier.

#### Scenario: a basic while statement parses

- **WHEN** a program contains `while (false) { 1 }`
- **THEN** the parser produces a `WhileStatement` node with the literal `false` as its condition and a body containing a single numeric expression

#### Scenario: while is a reserved keyword

- **WHEN** a program contains `while = 1`
- **THEN** the parser raises a syntax error

#### Scenario: missing parentheses around the condition is rejected

- **WHEN** a program contains `while true { 1 }`
- **THEN** the parser raises a syntax error

#### Scenario: missing braces around the body is rejected

- **WHEN** a program contains `while (true) 1`
- **THEN** the parser raises a syntax error

### Requirement: while iteration semantics

The interpreter SHALL evaluate the `while` condition before each iteration. When the condition's `toBoolean()` coercion is `true`, the body SHALL execute and control SHALL return to re-evaluating the condition. When the coercion is `false`, the loop SHALL terminate and control SHALL pass to the next statement. The condition SHALL use the same truthiness coercion as `if`.

#### Scenario: false condition skips the body entirely

- **WHEN** a program runs `count = 0` then `while (false) { count = count + 1 }` then evaluates `count`
- **THEN** `count` is `0`

#### Scenario: condition is re-evaluated each iteration and the loop terminates when it becomes false

- **WHEN** a program runs `i = 0` then `while (i < 3) { i = i + 1 }` then evaluates `i`
- **THEN** `i` is `3`

#### Scenario: non-boolean condition is coerced via toBoolean

- **WHEN** a program runs `n = 3` then `while (n) { n = n - 1 }` then evaluates `n`
- **THEN** `n` is `0` (the loop terminates when `n` coerces to `false`)

### Requirement: while body executes in the enclosing scope

A `while` body SHALL execute in the scope that surrounds the `while` statement. The interpreter MUST NOT create a child scope for the body. Bare assignments inside the body SHALL follow the rules established by the `variable-scoping` capability (writing to the enclosing function scope, or to the top-level scope when not inside a function). This requirement reaffirms, for `while`, the rule already declared by `variable-scoping` that function calls are the only scope-creating construct.

#### Scenario: bare assignment inside a while body persists after the loop

- **WHEN** a top-level program runs `n = 0` then `while (n < 3) { n = n + 1 }` then evaluates `n`
- **THEN** `n` is `3`

#### Scenario: a new variable introduced inside a while body is visible after the loop

- **WHEN** a top-level program runs `i = 0` then `while (i < 1) { result = 42; i = i + 1 }` then evaluates `result`
- **THEN** `result` is `42`

#### Scenario: local inside a while body inside a function binds in the function scope

- **WHEN** a function body runs `i = 0` then `while (i < 1) { local x = 7; i = i + 1 }` then returns `x`
- **THEN** the function returns `7`

### Requirement: while accepts an empty body

The parser SHALL accept `while (expression) {}` and the interpreter SHALL evaluate the condition repeatedly, terminating when it becomes false, without executing any body statements.

#### Scenario: empty-body loop terminates when the condition becomes false

- **WHEN** a program runs `i = 0` then `i = i + 1` then `while (false) {}` then evaluates `i`
- **THEN** `i` is `1` and the program completes without error

### Requirement: while statement evaluates to nothing

A `while` statement SHALL evaluate to the runtime `nothing` value, regardless of how many iterations executed or what the body's last expression evaluated to.

#### Scenario: while statement value is nothing

- **WHEN** a program runs `result = while (false) { 42 }` then evaluates `result`
- **THEN** `result` is `nothing`

### Requirement: return inside a while body exits the enclosing function

A `return` statement encountered while executing a `while` body inside a function SHALL terminate the function call immediately, returning the given value to the caller, without executing any further iterations or any code following the `while` statement in the function body.

#### Scenario: return from inside a while body returns from the enclosing function

- **WHEN** a function body runs `i = 0; while (true) { if (i == 2) { return i }; i = i + 1 }`
- **THEN** the function returns `2`

#### Scenario: return inside a while body bypasses statements after the loop

- **WHEN** a function body runs `while (true) { return 1 }; return 2`
- **THEN** the function returns `1`
