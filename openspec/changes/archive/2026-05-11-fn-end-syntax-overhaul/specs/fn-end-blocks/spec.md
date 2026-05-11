## ADDED Requirements

### Requirement: `fn` keyword replaces `function`

The lexer SHALL recognize `fn` as a reserved keyword and MUST NOT tokenize it as an identifier. The keyword `function` SHALL no longer be recognized as a keyword and SHALL be tokenized as a regular identifier. The parser SHALL use `fn` to begin both named and anonymous function declarations.

#### Scenario: fn is a reserved keyword

- **WHEN** a program contains `fn = 1`
- **THEN** the parser raises a syntax error

#### Scenario: function is no longer a keyword

- **WHEN** a program contains `function = 1`
- **THEN** the parser parses it as an assignment of the number `1` to the identifier `function`

#### Scenario: named function uses fn keyword

- **WHEN** a program contains `fn add(a, b)\n  return a + b\nend`
- **THEN** the parser produces a `FunctionDeclaration` node with name `"add"`, parameters `["a", "b"]`, and a body containing a return statement

#### Scenario: anonymous function uses fn keyword

- **WHEN** a program contains `x = fn(a, b)\n  return a + b\nend`
- **THEN** the parser produces a variable assignment whose value is a `FunctionDeclaration` node with name `undefined`, parameters `["a", "b"]`, and a body containing a return statement

### Requirement: `end` keyword closes blocks

The lexer SHALL recognize `end` as a reserved keyword and MUST NOT tokenize it as an identifier. The parser SHALL use `end` to close all block bodies (functions, `if`, `while`, `for`, `try`/`catch`). The parser SHALL NOT accept `{` or `}` as block delimiters.

#### Scenario: end is a reserved keyword

- **WHEN** a program contains `end = 1`
- **THEN** the parser raises a syntax error

#### Scenario: braces are rejected as block delimiters

- **WHEN** a program contains `fn foo() { return 1 }`
- **THEN** the parser raises a syntax error

#### Scenario: end closes a function body

- **WHEN** a program contains `fn foo()\n  return 1\nend`
- **THEN** the parser produces a `FunctionDeclaration` node with a body of one statement and consumes the `end` token

#### Scenario: end closes an if body

- **WHEN** a program contains `if true\n  print(1)\nend`
- **THEN** the parser produces an `IfStatement` node whose thenBranch contains one statement and no elseBranch

#### Scenario: end closes a while body

- **WHEN** a program contains `while true\n  print(1)\nend`
- **THEN** the parser produces a `WhileStatement` node whose body contains one statement

#### Scenario: empty body between fn and end

- **WHEN** a program contains `fn noop()\nend`
- **THEN** the parser produces a `FunctionDeclaration` node with an empty statements array

#### Scenario: empty body on one line

- **WHEN** a program contains `fn noop() end`
- **THEN** the parser produces a `FunctionDeclaration` node with an empty statements array

### Requirement: `then` keyword terminates conditions for single-line blocks

The `then` keyword SHALL be an optional condition terminator for `if` and `while` statements. When a condition is followed by `then`, the body MAY begin on the same line. When the condition is followed by a newline (no `then`), the body begins on the next line. `then` SHALL be a reserved keyword.

#### Scenario: then enables single-line if

- **WHEN** a program contains `if true then print(1) end`
- **THEN** the parser produces an `IfStatement` with condition `true` and a thenBranch of one statement

#### Scenario: then enables single-line while

- **WHEN** a program contains `while true then print(1) end`
- **THEN** the parser produces a `WhileStatement` with condition `true` and a body of one statement

#### Scenario: then is optional with newline

- **WHEN** a program contains `if true\n  print(1)\nend`
- **THEN** the parser produces an `IfStatement` (same as with `then`, newline terminates the condition)

#### Scenario: then is a reserved keyword

- **WHEN** a program contains `then = 1`
- **THEN** the parser raises a syntax error

#### Scenario: condition without then or newline is an error

- **WHEN** a program contains `if true print(1) end`
- **THEN** the parser raises a syntax error (condition must be terminated by `then` or newline)

### Requirement: `elseif` keyword replaces else-if chains

The parser SHALL recognize `elseif` as a single keyword that introduces an alternative condition within the same `if` statement. A single `end` SHALL close the entire `if`/`elseif`/`else` chain. The two-keyword sequence `else if` SHALL NOT be accepted as an elseif construct.

#### Scenario: elseif with else parses as one if statement

- **WHEN** a program contains `if a\n  1\nelseif b\n  2\nelse\n  3\nend`
- **THEN** the parser produces a single `IfStatement` node with an elseif branch and an else branch

#### Scenario: multiple elseif clauses

- **WHEN** a program contains `if a\n  1\nelseif b\n  2\nelseif c\n  3\nend`
- **THEN** the parser produces a single `IfStatement` with a chain of elseif branches and one `end`

#### Scenario: elseif is a reserved keyword

- **WHEN** a program contains `elseif = 1`
- **THEN** the parser raises a syntax error

#### Scenario: else if as two keywords is rejected

- **WHEN** a program contains `if a\n  1\nelse if b\n  2\nend`
- **THEN** the parser raises a syntax error (the `else` branch does not accept an `if` statement; use `elseif`)

### Requirement: `in` keyword is reserved

The lexer SHALL recognize `in` as a reserved keyword. It SHALL NOT be used as an identifier. The keyword is reserved for the upcoming `for`-each loop and is not yet used in any grammar rule.

#### Scenario: in is a reserved keyword

- **WHEN** a program contains `in = 1`
- **THEN** the parser raises a syntax error

### Requirement: Short-form anonymous function

When the token immediately after the closing `)` of a function's parameter list is on the same line (not a newline), the parser SHALL parse exactly one expression as the function body. The value of that expression SHALL be implicitly returned when the function is called. No `end` token SHALL be consumed. If `end` appears after the short-form expression, the parser SHALL raise a syntax error.

The short form is restricted to anonymous functions (no name after `fn`). Named functions always use the full form.

#### Scenario: short-form lambda with single expression

- **WHEN** a program contains `fn(x) x * 2`
- **THEN** the parser produces a `FunctionDeclaration` with name `undefined`, parameters `["x"]`, and a body that implicitly returns `x * 2`

#### Scenario: short-form lambda implicit return

- **WHEN** a program runs `f = fn(x) x * 2` then calls `f(3)`
- **THEN** the call returns `6`

#### Scenario: short-form lambda as callback argument

- **WHEN** a program passes `fn(x) x * 2` as an argument to a function
- **THEN** the parser parses it as a `FunctionDeclaration` expression within the argument list

#### Scenario: short-form with multiple parameters

- **WHEN** a program contains `fn(a, b) a + b`
- **THEN** the parser produces a `FunctionDeclaration` with parameters `["a", "b"]` and a body that implicitly returns `a + b`

#### Scenario: end after short form is a syntax error

- **WHEN** a program contains `fn(x) x * 2 end`
- **THEN** the parser raises a syntax error (short form must not be followed by `end`)

#### Scenario: named function cannot use short form

- **WHEN** a program contains `fn add(a, b) a + b`
- **THEN** the parser raises a syntax error (named functions must use full form with `end`)

#### Scenario: statement in short form is rejected

- **WHEN** a program contains `fn(x) return x`
- **THEN** the parser raises a syntax error (short form allows only a single expression, not a statement)

#### Scenario: newline after params triggers full form

- **WHEN** a program contains `fn(x)\n  return x * 2\nend`
- **THEN** the parser produces a `FunctionDeclaration` using full form (newline after `)` means full form with `end`)

### Requirement: Full-form function requires explicit return

Multi-statement function bodies (full form, with `end`) SHALL NOT implicitly return the last expression. The `return` keyword SHALL be required to produce a return value. If execution reaches the end of the function body without a `return`, the function SHALL return `nothing`.

#### Scenario: function without return returns nothing

- **WHEN** a program defines `fn foo()\n  1 + 2\nend` and calls `foo()`
- **THEN** the call returns `nothing`

#### Scenario: function with return returns the value

- **WHEN** a program defines `fn foo()\n  return 1 + 2\nend` and calls `foo()`
- **THEN** the call returns `3`

#### Scenario: return for early exit in full form

- **WHEN** a program defines `fn classify(n)\n  if n < 0\n    return -1\n  end\n  return n * 2\nend` and calls `classify(-5)`
- **THEN** the call returns `-1`

### Requirement: Parentheses are not required around if/while conditions

The parser SHALL NOT require parentheses around conditions in `if` and `while` statements. The condition SHALL be terminated by a newline or the `then` keyword. Parentheses around conditions MAY still be used for grouping but are not syntactically required.

#### Scenario: if without parentheses parses

- **WHEN** a program contains `if x > 0\n  print(x)\nend`
- **THEN** the parser produces an `IfStatement` with condition `x > 0`

#### Scenario: while without parentheses parses

- **WHEN** a program contains `while x > 0\n  x = x - 1\nend`
- **THEN** the parser produces a `WhileStatement` with condition `x > 0`

#### Scenario: parenthesized condition still allowed

- **WHEN** a program contains `if (x > 0)\n  print(x)\nend`
- **THEN** the parser produces an `IfStatement` with condition `x > 0` (parentheses treated as grouping)
