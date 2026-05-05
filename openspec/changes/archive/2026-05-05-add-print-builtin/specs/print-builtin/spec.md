## ADDED Requirements

### Requirement: print built-in is available without declaration
The interpreter SHALL pre-populate the root scope with a `print` identifier bound to a native callable before executing any user code.

#### Scenario: print is callable without prior declaration
- **WHEN** user code calls `print(42)` with no prior definition of `print`
- **THEN** the call succeeds and does not throw a NameError

### Requirement: print writes its argument's display representation to stdout
`print(x)` SHALL call `console.log` with the `display()` string of its single argument and return `nothing`.

#### Scenario: print a number
- **WHEN** `print(42)` is evaluated
- **THEN** `"42"` is written to stdout and the expression evaluates to `nothing`

#### Scenario: print a boolean true
- **WHEN** `print(true)` is evaluated
- **THEN** `"true"` is written to stdout

#### Scenario: print a boolean false
- **WHEN** `print(false)` is evaluated
- **THEN** `"false"` is written to stdout

#### Scenario: print nothing
- **WHEN** `print(nothing)` is evaluated
- **THEN** `"nothing"` is written to stdout

#### Scenario: print a string
- **WHEN** `print("hello")` is evaluated
- **THEN** `"hello"` is written to stdout (no surrounding quotes)

### Requirement: print accepts exactly one argument
`print` SHALL have arity 1. Calling it with any other number of arguments SHALL throw a RuntimeError.

#### Scenario: zero arguments
- **WHEN** `print()` is evaluated
- **THEN** a RuntimeError is thrown indicating wrong number of arguments

#### Scenario: two arguments
- **WHEN** `print(1, 2)` is evaluated
- **THEN** a RuntimeError is thrown indicating wrong number of arguments

### Requirement: print can be overwritten by user code
Because `print` lives in the root scope and assignment uses the standard walk-up semantics, user code SHALL be able to replace `print` with any value.

#### Scenario: overwrite print at top level
- **WHEN** user assigns `print = myFn` at the top level and then calls `print(1)`
- **THEN** `myFn` is called instead of the native built-in

### Requirement: all LuckyObject subtypes implement display
Every concrete `LuckyObject` subtype SHALL implement `display(): string` returning a human-readable representation.

#### Scenario: LuckyNumber display
- **WHEN** `display()` is called on `LuckyNumber(3.14)`
- **THEN** it returns `"3.14"`

#### Scenario: LuckyBoolean display
- **WHEN** `display()` is called on `LuckyBoolean.True`
- **THEN** it returns `"true"`

#### Scenario: LuckyNothing display
- **WHEN** `display()` is called on `LuckyNothing.Instance`
- **THEN** it returns `"nothing"`

#### Scenario: LuckyFunction display with name
- **WHEN** `display()` is called on a named `LuckyFunction` with name `"foo"`
- **THEN** it returns `"<function foo>"`

#### Scenario: LuckyFunction display anonymous
- **WHEN** `display()` is called on an anonymous `LuckyFunction` (name is undefined)
- **THEN** it returns `"<function>"`

### Requirement: helloWorld integration test demonstrates print with a user-defined function
A `src/examples/helloWorld.test.ts` file SHALL exist demonstrating `print` used inside a named function. The function `sayHello` SHALL accept a `name` argument and call `print` with the greeting `"Hello, " + name + "!"`.

#### Scenario: sayHello prints the expected greeting
- **WHEN** the program defines `sayHello(name)` and calls `sayHello("World")`
- **THEN** `"Hello, World!"` is written to stdout
