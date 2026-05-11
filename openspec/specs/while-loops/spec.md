### Requirement: `while` statement syntax

The parser SHALL recognize a `while` statement of the form `while expression (then | newline) block end`, where `block` is a newline-delimited statement list terminated by the `end` keyword. Parentheses around the condition SHALL NOT be required but MAY be used for grouping. `while` SHALL be a reserved keyword and MUST NOT be usable as an identifier. The condition SHALL be terminated by either a newline or the `then` keyword.

#### Scenario: a basic while statement parses

- **WHEN** a program contains `while false\n  1\nend`
- **THEN** the parser produces a `WhileStatement` node with the literal `false` as its condition and a body containing a single numeric expression

#### Scenario: while is a reserved keyword

- **WHEN** a program contains `while = 1`
- **THEN** the parser raises a syntax error

#### Scenario: parentheses around the condition are optional

- **WHEN** a program contains `while (false)\n  1\nend`
- **THEN** the parser produces a `WhileStatement` node (parentheses treated as grouping)

#### Scenario: then keyword terminates condition for single-line while

- **WHEN** a program contains `while true then print(1) end`
- **THEN** the parser produces a `WhileStatement` with condition `true` and a body of one statement

#### Scenario: condition without then or newline is an error

- **WHEN** a program contains `while true print(1) end`
- **THEN** the parser raises a syntax error

#### Scenario: missing end after body is rejected

- **WHEN** a program contains `while true\n  1`
- **THEN** the parser raises a syntax error

#### Scenario: braces around the body are rejected

- **WHEN** a program contains `while true { 1 }`
- **THEN** the parser raises a syntax error

### Requirement: while iteration semantics

The interpreter SHALL evaluate the `while` condition before each iteration. When the condition's `toBoolean()` coercion is `true`, the body SHALL execute and control SHALL return to re-evaluating the condition. When the coercion is `false`, the loop SHALL terminate and control SHALL pass to the next statement. The condition SHALL use the same truthiness coercion as `if`.

#### Scenario: false condition skips the body entirely

- **WHEN** a program runs `let count = 0` then `while false\n  count = count + 1\nend` then evaluates `count`
- **THEN** `count` is `0`

#### Scenario: condition is re-evaluated each iteration and the loop terminates when it becomes false

- **WHEN** a program runs `let i = 0` then `while i < 3\n  i = i + 1\nend` then evaluates `i`
- **THEN** `i` is `3`

#### Scenario: non-boolean condition is coerced via toBoolean

- **WHEN** a program runs `let n = 3` then `while n\n  n = n - 1\nend` then evaluates `n`
- **THEN** `n` is `0` (the loop terminates when `n` coerces to `false`)

### Requirement: while body executes in the enclosing scope

A `while` body SHALL execute in the scope that surrounds the `while` statement. The interpreter MUST NOT create a child scope for the body. Assignments inside the body SHALL follow the rules established by the `variable-scoping` and `variable-declarations` capabilities (declaration via `let`, reassignment via nearest existing binding). This requirement reaffirms, for `while`, the rule already declared by `variable-scoping` that function calls are the only scope-creating construct.

#### Scenario: reassignment inside a while body persists after the loop

- **WHEN** a top-level program runs `let n = 0` then `while n < 3\n  n = n + 1\nend` then evaluates `n`
- **THEN** `n` is `3`

#### Scenario: a new variable introduced inside a while body is visible after the loop

- **WHEN** a top-level program runs `let i = 0` then `while i < 1\n  let result = 42; i = i + 1\nend` then evaluates `result`
- **THEN** `result` is `42`

#### Scenario: let inside a while body inside a function binds in the function scope

- **WHEN** a function body runs `let i = 0` then `while i < 1\n  let x = 7; i = i + 1\nend` then returns `x`
- **THEN** the function returns `7`

### Requirement: while accepts an empty body

The parser SHALL accept `while expression end` (possibly with newlines) and the interpreter SHALL evaluate the condition repeatedly, terminating when it becomes false, without executing any body statements.

#### Scenario: empty-body loop terminates when the condition becomes false

- **WHEN** a program runs `let i = 0` then `i = i + 1` then `while false\nend` then evaluates `i`
- **THEN** `i` is `1` and the program completes without error

### Requirement: while statement evaluates to nothing

A `while` statement SHALL evaluate to the runtime `nothing` value, regardless of how many iterations executed or what the body's last expression evaluated to.

#### Scenario: while statement value is nothing

- **WHEN** a program runs `let result = while false\n  42\nend` then evaluates `result`
- **THEN** `result` is `nothing`

### Requirement: return inside a while body exits the enclosing function

A `return` statement encountered while executing a `while` body inside a function SHALL terminate the function call immediately, returning the given value to the caller, without executing any further iterations or any code following the `while` statement in the function body.

#### Scenario: return from inside a while body returns from the enclosing function

- **WHEN** a function body runs `let i = 0; while true\n  if i == 2\n    return i\n  end\n  i = i + 1\nend`
- **THEN** the function returns `2`

#### Scenario: return inside a while body bypasses statements after the loop

- **WHEN** a function body runs `while true\n  return 1\nend; return 2`
- **THEN** the function returns `1`
