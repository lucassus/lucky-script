## ADDED Requirements

### Requirement: Function definition syntax

The calculator grammar SHALL admit a top-level function definition of the form `def <name>(<params>?) <newline> <body> end`, where `<params>` is a comma-separated list of identifiers and `<body>` is a `Block`.

`def` and `return` SHALL be reserved keywords (rejected as bare identifiers, same as `if`, `while`, `end`).

#### Scenario: Function with parameters and body parses

- **WHEN** source matches `def add(a, b)\n  return a + b\nend`
- **THEN** parsing succeeds and the program contains a function definition node with `name = "add"`, `params = ["a", "b"]`, and a body containing a single return statement

#### Scenario: Function with no parameters parses

- **WHEN** source matches `def f()\n  return 1\nend`
- **THEN** parsing succeeds and the function definition has an empty parameter list

#### Scenario: Function with empty body parses

- **WHEN** source matches `def f()\nend`
- **THEN** parsing succeeds and the function definition has an empty body

#### Scenario: def is reserved

- **WHEN** source uses `def` as a bare identifier (e.g. as a variable name)
- **THEN** parsing fails the same way it fails for other keywords used as identifiers

#### Scenario: return is reserved

- **WHEN** source uses `return` as a bare identifier (e.g. as a variable name)
- **THEN** parsing fails the same way it fails for other keywords used as identifiers

### Requirement: Top-level only function definitions

A function definition (`def`) SHALL be valid only as a top-level statement. A `def` nested inside an `if`, `while`, or another function body SHALL be rejected at compile time with a clear error message.

#### Scenario: Top-level def compiles

- **WHEN** source contains a `def` directly inside the top-level statement list
- **THEN** compilation succeeds

#### Scenario: Nested def inside if rejected

- **WHEN** source contains a `def` inside an `if` body
- **THEN** compilation fails with an error indicating `def` is only allowed at the top level

#### Scenario: Nested def inside while rejected

- **WHEN** source contains a `def` inside a `while` body
- **THEN** compilation fails with an error indicating `def` is only allowed at the top level

#### Scenario: Nested def inside another def rejected

- **WHEN** source contains a `def` inside another function's body
- **THEN** compilation fails with an error indicating `def` is only allowed at the top level

### Requirement: Return statement syntax

The calculator grammar SHALL admit a `return` statement of the form `return <expr>?`. The expression operand SHALL be optional; a bare `return` (with no expression) SHALL be valid syntax.

#### Scenario: Return with expression parses

- **WHEN** source contains `return a + 1` inside a function body
- **THEN** parsing succeeds and produces a return statement node whose value is the parsed expression

#### Scenario: Bare return parses

- **WHEN** source contains `return` (no expression) inside a function body
- **THEN** parsing succeeds and produces a return statement node with no value

#### Scenario: Return outside function rejected

- **WHEN** source contains a `return` statement that is not inside any function body
- **THEN** compilation fails with an error indicating `return` is not allowed outside of a function

### Requirement: Call expression syntax

The calculator grammar SHALL admit a call expression of the form `<name>(<args>?)` as a primary expression, where `<args>` is a comma-separated list of `AssignExp`. Call expressions SHALL be usable everywhere a primary expression is allowed (including as the right-hand side of an assignment, as an argument to another call, and as a complete expression statement).

#### Scenario: Call with arguments parses

- **WHEN** source contains `add(2, 3)` as an expression
- **THEN** parsing succeeds and the expression is a call node with `name = "add"` and two argument expressions

#### Scenario: Call with no arguments parses

- **WHEN** source contains `now()` as an expression
- **THEN** parsing succeeds and the expression is a call node with an empty argument list

#### Scenario: Call in arithmetic expression

- **WHEN** source contains `1 + double(x) * 2` as an expression
- **THEN** parsing succeeds with operator precedence respected (the call binds tighter than `*`)

#### Scenario: Call as statement

- **WHEN** source contains `f(1, 2)` alone on a line
- **THEN** parsing succeeds and the statement is an expression statement wrapping a call

#### Scenario: Nested calls parse

- **WHEN** source contains `outer(inner(1), 2)` as an expression
- **THEN** parsing succeeds with `inner(1)` as the first argument to `outer`

### Requirement: Two-pass compilation with forward references

The compiler SHALL register every top-level function name before compiling any function body, so that a function may reference any other top-level function (including itself and functions declared later in the source) regardless of source order.

#### Scenario: Recursion compiles

- **WHEN** a function calls itself by name from its own body
- **THEN** compilation succeeds and the call resolves to the enclosing function

#### Scenario: Forward reference compiles

- **WHEN** a function `f` calls a function `g` whose `def` appears later in the source
- **THEN** compilation succeeds and the call in `f` resolves to `g`

#### Scenario: Mutual recursion compiles

- **WHEN** function `even` calls `odd` and function `odd` calls `even`
- **THEN** compilation succeeds and both calls resolve

#### Scenario: Duplicate function names rejected

- **WHEN** two `def` statements at the top level share the same name
- **THEN** compilation fails with an error indicating a duplicate function definition

#### Scenario: Call to unknown function rejected

- **WHEN** a call references a name that has no matching `def` at the top level
- **THEN** compilation fails with an error indicating the function is unknown

### Requirement: Call arity is checked at compile time

The compiler SHALL verify that every call site supplies exactly the number of arguments declared by the called function's parameter list and SHALL reject any mismatch with a clear error.

#### Scenario: Correct arity compiles

- **WHEN** a call to `def f(a, b)` supplies exactly two arguments
- **THEN** compilation succeeds

#### Scenario: Too few arguments rejected

- **WHEN** a call to `def f(a, b)` supplies one argument
- **THEN** compilation fails with an error indicating an arity mismatch

#### Scenario: Too many arguments rejected

- **WHEN** a call to `def f(a, b)` supplies three arguments
- **THEN** compilation fails with an error indicating an arity mismatch

### Requirement: Isolated function scope

Inside a function body, variable resolution SHALL use only that function's local symbol table. The compiler SHALL reject reads of names not declared in the function's locals (parameters and prior assignments) with a clear error. Assignments inside a function body SHALL always create or update a local slot in that function and SHALL NOT affect top-level (`__main`) bindings.

#### Scenario: Parameter is a local

- **WHEN** a function body references a parameter declared in its `def`
- **THEN** the reference reads that parameter's value at call time, not any same-named top-level binding

#### Scenario: Assignment in function is local

- **WHEN** a function body assigns to a name that also exists as a top-level binding
- **THEN** the assignment updates a function-local slot and the top-level binding is unchanged after the call returns

#### Scenario: Top-level read from inside function rejected

- **WHEN** a function body reads a name that is not a parameter and not previously assigned in the function
- **THEN** compilation fails with an error indicating the name is unknown, even if a top-level binding by that name exists

#### Scenario: Distinct function scopes

- **WHEN** two functions each define a local named `x` and one calls the other
- **THEN** each function's `x` is independent and assignments in one do not affect the other

### Requirement: Implicit return zero

A function body that completes without executing an explicit `return` SHALL behave as if `return 0` were the final statement. A bare `return` (with no expression) SHALL behave as `return 0`.

#### Scenario: Function with no return falls through to zero

- **WHEN** a function body executes to its end without hitting a `return`
- **THEN** the call yields the value `0`

#### Scenario: Bare return yields zero

- **WHEN** a function executes a `return` statement with no expression
- **THEN** the call yields the value `0`

#### Scenario: Returned value propagates

- **WHEN** a function executes `return <expr>` for some expression
- **THEN** the call yields the value of that expression

### Requirement: Function call frames in the VM

The VM SHALL maintain a stack of call frames. Each frame SHALL hold the executing function's bytecode reference, an instruction pointer, and a name-keyed local bindings map. Frames SHALL be pushed on `CALL` and popped on `RETURN`, with the return value left on the operand stack for the caller. `LOAD_L` and `STORE_L` SHALL always access the current (top) frame's locals map and never any other frame's locals.

#### Scenario: Simple call returns to caller

- **WHEN** a top-level expression invokes a function that returns a value
- **THEN** the VM pushes a frame for the callee, runs its bytecode, pops the frame on `RETURN`, and resumes top-level execution with the return value on the operand stack

#### Scenario: Recursion uses multiple frames

- **WHEN** a function recursively calls itself N times before returning
- **THEN** at peak depth the frame stack contains N + 1 frames (the main frame plus N recursive frames) and the final result is the value produced by unwinding all recursive returns

#### Scenario: Arguments bind to parameter names in declaration order

- **WHEN** a call passes arguments to a function with parameters `(a, b, c)`
- **THEN** inside the callee, the local named `a` holds the first argument's value, `b` the second's, and `c` the third's

### Requirement: Frame depth cap

The VM SHALL accept a `maxFrameDepth` runtime option (default `1024`) and SHALL throw a distinct runtime error class when a `CALL` would push a frame beyond that limit.

#### Scenario: Within limit succeeds

- **WHEN** a recursion reaches a depth strictly less than `maxFrameDepth`
- **THEN** the call sequence completes normally

#### Scenario: Exceeding limit throws

- **WHEN** a recursion would push a frame at depth equal to `maxFrameDepth`
- **THEN** the VM throws a frame-stack-overflow error before the new frame becomes active

#### Scenario: Cap is independent of operand stack cap

- **WHEN** a program approaches but does not exceed `maxStackDepth` while exceeding `maxFrameDepth`
- **THEN** the VM throws the frame-stack-overflow error, not the operand-stack-overflow error

### Requirement: Function and variable namespaces are separate

A function name and a variable name MAY coexist without conflict. A bare identifier (without parentheses) SHALL resolve only to a variable; an identifier followed by `(...)` SHALL resolve only to a function.

#### Scenario: Same name as function and variable

- **WHEN** source defines `def foo() return 1 end` at the top level and also assigns `foo = 7`
- **THEN** compilation succeeds, `foo` (bare) reads the variable `7`, and `foo()` calls the function and yields `1`

#### Scenario: Function name as a value rejected

- **WHEN** source uses a function name as a bare expression where no matching variable exists (e.g. `x = add` where `add` is only a function)
- **THEN** compilation fails because no variable named `add` exists

### Requirement: Bytecode opcode additions and rename

The calculator instruction set SHALL include new opcodes for name-keyed locals (`LOAD_L name`, `STORE_L name`), function invocation (`CALL fnIndex argc`), and return from a call frame (`RETURN`). The existing `LOAD` and `STORE` opcodes SHALL be renamed to `LOAD_G` and `STORE_G` respectively. All four `LOAD`/`STORE` variants SHALL carry the same operand shape (a string name). The `_G` and `_L` suffixes select which storage container the VM accesses: `_G` reads/writes the VM-level globals map; `_L` reads/writes the current frame's locals map. Top-level (`__main`) reads and writes of a bare identifier SHALL compile to `LOAD_G` / `STORE_G`; reads and writes inside any function body SHALL compile to `LOAD_L` / `STORE_L`.

#### Scenario: Global assignment compiles to STORE_G

- **WHEN** a top-level statement assigns to a name (e.g. `x = 5`)
- **THEN** the emitted bytecode contains a `STORE_G` instruction carrying that name

#### Scenario: Local assignment compiles to STORE_L

- **WHEN** a statement inside a function body assigns to a name
- **THEN** the emitted bytecode for that function contains a `STORE_L` instruction carrying that name (not a slot index)

#### Scenario: Local read compiles to LOAD_L

- **WHEN** an expression inside a function body reads a name that is a parameter or a previously assigned local
- **THEN** the emitted bytecode contains a `LOAD_L` instruction carrying that name

#### Scenario: Call site emits CALL

- **WHEN** a call expression appears in the source
- **THEN** the emitted bytecode evaluates each argument expression in order followed by a `CALL` instruction whose `fnIndex` resolves to the called function and whose `argc` matches the argument count

#### Scenario: Function epilogue emits RETURN

- **WHEN** any function body is compiled
- **THEN** the emitted bytecode for that function ends with a `RETURN` instruction (preceded by `PUSH 0` when the body does not unconditionally return on every path; the simplest implementation always emits this epilogue)

### Requirement: Existing programs remain compatible

All calculator source programs that do not use `def`, `return`, or call expressions SHALL parse, compile, and run with the same observable results as before this change. The internal renaming of `LOAD`/`STORE` to `LOAD_G`/`STORE_G` SHALL NOT change any program's output.

#### Scenario: Regression — arithmetic unchanged

- **WHEN** any pre-existing arithmetic program (e.g. `(1 + 2) * -3`) runs after this change
- **THEN** it produces the same result as before

#### Scenario: Regression — control flow unchanged

- **WHEN** any pre-existing program using `if`, `else`, `while`, `break`, or `continue` runs after this change
- **THEN** it produces the same result as before

#### Scenario: Regression — global variables unchanged

- **WHEN** any pre-existing program using top-level variables (assignment, reassignment, chained assignment) runs after this change
- **THEN** it produces the same result as before

### Requirement: Verification

The change SHALL include automated tests at the grammar, parser, compiler, VM, and integration layers covering function definitions, calls, returns, isolated scope, the two-pass compile, recursion, mutual recursion, the implicit-zero return rule, all documented compile errors, and the frame depth cap.

#### Scenario: Integration coverage

- **WHEN** the calculator test suite runs after this change
- **THEN** it includes integration tests for at least: a simple call returning a computed value, single recursion (e.g. factorial), mutual recursion, early return inside an `if`, implicit-zero return when no `return` is hit, bare `return`, a statement-position call whose value is discarded, and a frame-overflow case with a tiny `maxFrameDepth`
