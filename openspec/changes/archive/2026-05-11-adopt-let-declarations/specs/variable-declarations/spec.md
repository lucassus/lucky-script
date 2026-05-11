## ADDED Requirements

### Requirement: `let` declares a binding in the current lexical scope
The language SHALL support `let name = expression` to create a new binding in the current scope. If a binding with the same name already exists in the current scope, `let` SHALL rebind that local name. A `let` declaration inside a function SHALL shadow same-named bindings in enclosing scopes.

#### Scenario: let declares and returns a top-level binding
- **WHEN** the program runs `let x = 1` and then evaluates `x`
- **THEN** `x` evaluates to `1`

#### Scenario: let inside function shadows an outer binding
- **WHEN** the program runs `let x = 1`, defines `fn foo(); let x = 2; return x; end`, calls `foo()`, then evaluates `x`
- **THEN** `foo()` returns `2` and outer `x` remains `1`

#### Scenario: let re-declaration in the same scope rebinds without error
- **WHEN** a function body runs `let x = 1` then `let x = 2` then returns `x`
- **THEN** the function returns `2` and no re-declaration error is raised

### Requirement: assignment requires a previously declared binding
For `name = expression` and compound assignment operators (`+=`, `-=`, `*=`, `/=`), the interpreter SHALL require that `name` already exists in the current scope chain excluding the frozen builtins root, including when the assignment is evaluated at the top level. If no existing writable binding is found, evaluation SHALL raise `NameError` naming `name`.

#### Scenario: assignment to undeclared top-level name fails
- **WHEN** the program evaluates `x = 1` without any prior declaration of `x`
- **THEN** evaluation raises `NameError` naming `x`

#### Scenario: assignment to undeclared function-local name fails
- **WHEN** the program defines `fn foo(); x = 1; end` with no declaration of `x` in any enclosing writable scope, then calls `foo()`
- **THEN** evaluation raises `NameError` naming `x`

### Requirement: reassignment mutates the nearest existing binding
For `name = expression` and compound assignment operators, the interpreter SHALL update the closest enclosing writable scope that already defines `name`, starting from the current scope and walking outward.

#### Scenario: inner function assignment mutates enclosing function state
- **WHEN** the program defines `fn make(); let n = 0; fn inc(); n = n + 1; end; inc(); inc(); return n; end` and calls `make()`
- **THEN** the call returns `2`

#### Scenario: nearest declaration wins during reassignment
- **WHEN** the program runs `let x = 1`, defines `fn foo(); let x = 5; x = 9; return x; end`, calls `foo()`, then evaluates outer `x`
- **THEN** `foo()` returns `9` and outer `x` remains `1`
