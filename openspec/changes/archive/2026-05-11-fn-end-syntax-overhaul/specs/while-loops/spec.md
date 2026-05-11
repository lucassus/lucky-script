## MODIFIED Requirements

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
