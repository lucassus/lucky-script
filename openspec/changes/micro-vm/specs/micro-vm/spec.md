## ADDED Requirements

### Requirement: Sketchbook bytecode pipeline
The system SHALL provide a sketchbook backend that compiles a `parse()` AST into a `BytecodeModule` and executes it with a stack-based virtual machine.

#### Scenario: End-to-end execution
- **WHEN** supported sketchbook source is parsed, compiled, and run
- **THEN** the VM returns a numeric result without using `evaluate()`

#### Scenario: Reference backend preserved
- **WHEN** the same source is executed with `evaluate()`
- **THEN** the existing tree-walking sketchbook runtime behavior is unchanged

### Requirement: Structured bytecode representation
The system SHALL represent bytecode as an ordered list of structured instruction records using a shared opcode type.

#### Scenario: Instructions are inspectable
- **WHEN** a program is compiled
- **THEN** the result exposes human-readable instruction objects suitable for golden tests and optional disassembly

#### Scenario: Jump targets are resolved indices
- **WHEN** compilation completes
- **THEN** all `JUMP` and `JUMP_IF_ZERO` targets refer to instruction indices, not unresolved labels

### Requirement: Number-only stack values
The VM SHALL use numeric stack slots and local slots exclusively in v1.

#### Scenario: Truthiness for control flow
- **WHEN** `JUMP_IF_ZERO` executes
- **THEN** the VM jumps when the popped value is exactly `0`

#### Scenario: Comparison results
- **WHEN** a comparison instruction executes
- **THEN** the VM pushes `1` for true and `0` for false

### Requirement: Globals and frame locals without closures
The compiler and VM SHALL use global slots for top-level bindings and per-frame local slots for function parameters and in-function bindings.

#### Scenario: Top-level let uses globals
- **WHEN** a `let` statement appears at program top level
- **THEN** compilation emits global store/load slot operations

#### Scenario: Function parameters use locals
- **WHEN** a named function is called
- **THEN** arguments are copied into the callee frame local slots `0..arity-1`

#### Scenario: Recursive calls use separate frames
- **WHEN** a function calls itself recursively
- **THEN** each invocation receives its own call frame and local array

#### Scenario: No closure capture
- **WHEN** compilation would require reading an enclosing function's local slot from an inner function
- **THEN** compilation fails with a clear unsupported error

### Requirement: Program entry via synthetic main
The compiler SHALL wrap top-level statements in a synthetic function proto at index `0` named `__main` with arity `0`, and the module entry point SHALL reference that function.

#### Scenario: Function defs do not run at load time
- **WHEN** a script defines functions and ends with an expression statement
- **THEN** only `__main` executes at startup and function bodies run when called

### Requirement: v1 supported sketchbook surface
The micro-vm v1 compiler and VM SHALL support this sketchbook AST subset:

- `Program`, `Let`, `Assign`, `ExprStmt`
- `FunDef`, `Return`, `Call` with identifier callee
- `If` with optional `else` (no `elseif` in v1)
- `Binary` with operators `+`, `-`, `*`, `/`, `<`, `==`
- numeric `Literal`

#### Scenario: Fibonacci parity
- **WHEN** the canonical recursive fibonacci sketchbook program is compiled and run for `n` from `0` through `9`
- **THEN** results match `evaluate()` on the same source for each `n`

#### Scenario: If without else
- **WHEN** an `if` has a then-branch but no else-branch
- **THEN** compilation and execution succeed and control continues after the `if` when the condition is false

### Requirement: Unsupported nodes fail at compile time
The compiler SHALL reject unsupported sketchbook AST constructs with explicit errors rather than emitting partial bytecode.

#### Scenario: Elseif rejected in v1
- **WHEN** the AST contains an `if` with one or more `elseif` branches
- **THEN** compilation fails before VM execution

#### Scenario: Unsupported operators rejected in v1
- **WHEN** the AST contains `%`, `^`, `and`, `or`, `not`, or comparisons other than `<` and `==`
- **THEN** compilation fails with an error naming the unsupported feature

### Requirement: v1 instruction set
The VM SHALL implement at minimum these opcodes: `CONST`, `LOAD_G`, `STORE_G`, `LOAD_L`, `STORE_L`, `ADD`, `SUB`, `MUL`, `DIV`, `LT`, `EQ`, `JUMP`, `JUMP_IF_ZERO`, `CALL`, `RETURN`, `POP`.

#### Scenario: Named call by function index
- **WHEN** a `Call` to a named function is compiled
- **THEN** the instruction references the callee's function proto index and argument count

#### Scenario: Function epilogue returns
- **WHEN** a function body finishes without an explicit `return`
- **THEN** the VM returns `0` after the compiler-emitted epilogue

### Requirement: Layered verification tests
The system SHALL include tests at three levels: compile golden fixtures, isolated VM opcode behavior, and end-to-end parity with `evaluate()` on supported programs.

#### Scenario: Compile regression coverage
- **WHEN** small supported snippets are compiled in tests
- **THEN** expected instruction sequences are asserted directly

#### Scenario: VM opcode coverage
- **WHEN** hand-written minimal bytecode modules are executed
- **THEN** individual opcode families are verified independent of the full compiler

#### Scenario: Parity coverage
- **WHEN** supported multi-statement programs are run through both backends
- **THEN** `run(compile(parse(source)))` equals `evaluate(source)`
