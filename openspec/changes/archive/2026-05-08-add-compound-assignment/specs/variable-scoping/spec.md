## MODIFIED Requirements

### Requirement: Bare assignment inside a function binds locally

Inside a function body, `x = e` SHALL bind `x` in the current function scope. If `x` already has a binding in that scope, the existing local SHALL be rebound. The interpreter SHALL NOT walk past the function boundary to find an outer binding for a bare assignment. At the top level (no enclosing function), `x = e` SHALL create or reassign the binding in the top-level scope.

This behavior SHALL also apply to compound assignment operators (`+=`, `-=`, `*=`, `/=`), which desugar to simple assignment at parse time.

#### Scenario: bare assignment inside a function does not mutate an outer binding

- **WHEN** the program runs `x = 1`, then defines `fn foo(); x = 99; end`, calls `foo()`, then evaluates `x`
- **THEN** `x` is `1`

#### Scenario: bare assignment inside a function rebinds the local on subsequent writes

- **WHEN** a function body runs `x = 1` then `x = 2` then returns `x`
- **THEN** the function returns `2`

#### Scenario: bare assignment at the top level reassigns the existing top-level binding

- **WHEN** a top-level program runs `x = 1` then `x = 2` then evaluates `x`
- **THEN** `x` is `2`

#### Scenario: bare compound assignment inside a function creates local binding

- **WHEN** the program runs `x = 1`, then defines `fn foo(); x += 99; end`, calls `foo()`, then evaluates `x`
- **THEN** `x` is `1` (compound assignment desugared to bare assignment, which bound locally)

### Requirement: `local` keyword forces binding in the current scope

`local x = e` SHALL always bind `x` in the current scope. If `x` already exists in that scope it SHALL be silently rebound. If a same-named binding exists in any enclosing scope (including builtins), the new local SHALL shadow it for the remainder of the current function. `local` is permitted at the top level; there it behaves the same as bare assignment.

This behavior SHALL also apply to compound assignment operators (`+=`, `-=`, `*=`, `/=`), which desugar to simple assignment at parse time. For compound assignment, the right-hand side expression SHALL read `x` via normal lookup before writing to the local binding.

#### Scenario: local shadows an outer variable

- **WHEN** the program runs `x = 1`, defines `fn foo(); local x = 99; end`, calls `foo()`, then evaluates `x`
- **THEN** `x` is `1`

#### Scenario: local shadows a builtin inside a function

- **WHEN** a function body runs `local print = "shadowed"` and then evaluates `print`
- **THEN** the function sees the string `"shadowed"`, and after the call the global `print` builtin is still callable

#### Scenario: duplicate local in the same scope rebinds silently

- **WHEN** a function body runs `local x = 1` then `local x = 2` then returns `x`
- **THEN** the function returns `2` and no error is raised

#### Scenario: local compound assignment reads outer then writes local

- **WHEN** the program runs `x = 1`, then a function body runs `local x += 5` and returns `x`
- **THEN** the function returns `6` (outer `x` was read, local `x` was created with the result)

### Requirement: `outer` keyword writes to the nearest enclosing binding

`outer x = e` SHALL search for an existing binding of `x` in scopes strictly outside the current function boundary, walking up until either a binding is found or the chain (including builtins) is exhausted. If a binding is found, the value SHALL be written into that scope, replacing the previous value. If no binding is found in any enclosing scope, the interpreter SHALL raise a runtime error naming the variable. `outer` SHALL NOT create a new binding under any circumstances. Builtins SHALL be excluded from `outer` writes — even if a builtin name matches, the `outer` write SHALL fail with the same runtime error.

This behavior SHALL also apply to compound assignment operators (`+=`, `-=`, `*=`, `/=`), which desugar to simple assignment at parse time.

#### Scenario: outer mutates an enclosing function variable

- **WHEN** the program defines `fn make(); local n = 0; fn inc(); outer n = n + 1; end; inc(); inc(); n; end` and calls `make()`
- **THEN** the call returns `2`

#### Scenario: outer mutates a top-level variable

- **WHEN** the program runs `x = 1`, defines `fn foo(); outer x = 99; end`, calls `foo()`, then evaluates `x`
- **THEN** `x` is `99`

#### Scenario: outer with no enclosing binding raises a runtime error

- **WHEN** a function body runs `outer y = 1` and no binding for `y` exists in any enclosing scope
- **THEN** evaluating that statement raises a runtime error whose message names `y`

#### Scenario: outer cannot mutate a builtin

- **WHEN** a function body runs `outer print = "nope"`
- **THEN** evaluating that statement raises a runtime error and the `print` builtin remains callable

#### Scenario: outer compound assignment mutates enclosing variable

- **WHEN** the program runs `x = 10`, defines `fn foo(); outer x += 5; end`, calls `foo()`, then evaluates `x`
- **THEN** `x` is `15`
