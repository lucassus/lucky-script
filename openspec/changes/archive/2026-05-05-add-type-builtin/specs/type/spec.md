## ADDED Requirements

### Requirement: type() returns the type name of a value

The `type` builtin SHALL accept exactly one argument and return a string naming its runtime type.

#### Scenario: type of a number

- **WHEN** `type(42)` is evaluated
- **THEN** the result is the string `"number"`

#### Scenario: type of a string

- **WHEN** `type("hello")` is evaluated
- **THEN** the result is the string `"string"`

#### Scenario: type of true

- **WHEN** `type(true)` is evaluated
- **THEN** the result is the string `"boolean"`

#### Scenario: type of false

- **WHEN** `type(false)` is evaluated
- **THEN** the result is the string `"boolean"`

#### Scenario: type of nothing

- **WHEN** `type(nothing)` is evaluated
- **THEN** the result is the string `"nothing"`

#### Scenario: type of a user-defined function

- **WHEN** a function is declared and passed to `type()`
- **THEN** the result is the string `"function"`

#### Scenario: wrong arity

- **WHEN** `type()` is called with zero arguments
- **THEN** a RuntimeError is thrown

#### Scenario: wrong arity with two args

- **WHEN** `type(1, 2)` is called with two arguments
- **THEN** a RuntimeError is thrown
