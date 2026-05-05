## ADDED Requirements

### Requirement: While loop syntax
The system SHALL parse while loop statements with the syntax `while (condition) { body }`.

#### Scenario: Parse while loop with block body
- **WHEN** the parser encounters `while (x < 5) { x = x + 1 }`
- **THEN** it produces a WhileStatement AST node with the condition and body

#### Scenario: Parse while loop with single statement body
- **WHEN** the parser encounters `while (x > 0) x = x - 1`
- **THEN** it treats the single statement as the loop body

### Requirement: While loop execution
The system SHALL repeatedly execute the loop body while the condition is truthy.

#### Scenario: Loop executes while condition is true
- **WHEN** executing `x = 0; while (x < 3) { x = x + 1 }`
- **THEN** x becomes 3 after the loop

#### Scenario: Loop terminates when condition becomes false
- **WHEN** executing `x = 5; while (x > 0) { x = x - 1 }`
- **THEN** the loop terminates and x equals 0

#### Scenario: Loop does not execute if condition is initially false
- **WHEN** executing `x = 10; while (x < 5) { x = x + 1 }`
- **THEN** the loop body never executes and x remains 10

### Requirement: Loop condition coercion to boolean
The system SHALL coerce loop conditions to boolean using truthiness rules (0 and empty string are falsy, all other values are truthy).

#### Scenario: Numeric condition coercion
- **WHEN** executing `x = 1; while (x) { x = x - 1 }`
- **THEN** the loop executes once (1 is truthy) and terminates when x becomes 0 (falsy)

#### Scenario: String condition coercion
- **WHEN** executing `s = "x"; while (s) { s = "" }`
- **THEN** the loop executes once and terminates when s becomes empty (falsy)

### Requirement: Loop body executes in enclosing scope
The system SHALL execute the loop body in the enclosing scope (not create a child scope). Variables created or modified in the loop body are visible in the enclosing scope after the loop exits.

#### Scenario: Variable assignment in loop body is visible after loop
- **WHEN** executing `while (true) { y = 42; break }` (assuming break exists) or `while (false) { y = 42 }; y`
- **THEN** the variable y is accessible in the enclosing scope

#### Scenario: Loop variable modifications persist after loop
- **WHEN** executing `x = 0; while (x < 3) { x = x + 1 }; print(x)`
- **THEN** x equals 3 after the loop, proving the loop variable persists

### Requirement: Loop returns nothing
The system SHALL return LuckyNothing (silent/void return) from while loop execution.

#### Scenario: While loop result is nothing
- **WHEN** executing `result = while (x < 2) { x = x + 1 }` (in a context where the loop's return value can be captured)
- **THEN** result is nothing (in practice, while loops are statements, not expressions)

### Requirement: Nested loop support
The system SHALL support while loops nested inside other while loops, functions, or if statements.

#### Scenario: Nested while loops
- **WHEN** executing nested loops (e.g., multiplication table: outer loop iterating rows, inner loop iterating columns)
- **THEN** both loops execute correctly with proper variable scoping

### Requirement: Return statement in while loop
The system SHALL allow return statements inside while loops. When a return is executed, it exits the enclosing function immediately, terminating the loop.

#### Scenario: Return statement exits loop and function
- **WHEN** executing a function containing `while (x < 100) { if (x == 5) return 42; x = x + 1 }`
- **THEN** the function returns 42 when x reaches 5, terminating the loop early
