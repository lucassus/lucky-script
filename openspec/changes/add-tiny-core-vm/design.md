## Context

Lucky Script architecture today is:

`Lexer -> Parser -> Interpreter`

The parser already builds a stable AST for expressions, variables, control flow, and functions. The interpreter walks that AST directly with lexical scope support and broader language features (strings, anonymous functions, closures, while loops, `local`/`outer`).

For `tiny-core`, we intentionally avoid full language support and add a second backend:

`Lexer -> Parser -> Compiler(tiny-core subset) -> Bytecode -> VM`

The interpreter remains the source of truth and is not replaced.

## Goals / Non-Goals

**Goals**

- Build a minimal, understandable stack VM pipeline
- Support enough language surface to run real recursive programs
- Keep implementation small and explicit, with clear compile-time errors for unsupported nodes
- Preserve interpreter behavior and code path unchanged

**Non-Goals**

- No closures/upvalues
- No anonymous functions in VM v1
- No strings or dedicated boolean runtime type in VM v1
- No `while`, `break`, or `continue` in VM v1
- No optimization passes, JIT, or bytecode verification framework

## tiny-core Surface Area

Supported syntax/AST in compiler:

- `Program`
- `Numeral`
- `BinaryOperation` with operators: `+`, `-`, `*`, `<`, `==`
- `VariableAssigment` (plain assignment behavior in VM rules)
- `VariableAccess`
- `FunctionDeclaration` (named only)
- `FunctionCall` (identifier callee)
- `IfStatement` with optional else
- `ReturnStatement`

Unsupported in v1 (compiler error):

- `StringLiteral`, `NothingLiteral`, `BooleanLiteral`
- unary ops
- `/`, `**`, `<=`, `!=`, `>=`, `>`, `and`, `or`, `not`
- anonymous function declarations
- `WhileStatement`, `BreakStatement`, `ContinueStatement`
- assignment modes that require cross-scope write semantics (`local`, `outer`)

## Data Model

### Value Representation

Use a single runtime value type for v1:

- `number`

Truthiness rule:

- `0` is false
- any non-zero number is true

Comparison ops push numeric booleans:

- true => `1`
- false => `0`

This removes the need for a separate boolean object model in tiny-core v1.

### Bytecode Program Layout

```
BytecodeModule
  constants: number[]
  functions: FunctionProto[]
  entry: function index

FunctionProto
  name: string
  arity: number
  localCount: number
  code: Instruction[]
```

Function lookup for `CALL` is by function name table in module metadata.

## Instruction Set (v1)

```
CONST k            ; push constants[k]
LOAD_G n           ; push globals[name[n]]
STORE_G n          ; pop -> globals[name[n]]
LOAD_L i           ; push currentFrame.locals[i]
STORE_L i          ; pop -> currentFrame.locals[i]

ADD
SUB
MUL
LT
EQ

JUMP addr
JUMP_IF_ZERO addr

CALL fnNameIdx argc
RETURN
POP
```

Note: we keep `CALL` name-based in v1 to avoid first-class function values. This is simpler and still supports recursion.

## Compiler Design

### C1: Two-level symbol model

- Top-level assignments compile to globals (`STORE_G`)
- Function parameters and intra-function assigned names compile to local slots (`STORE_L`)

No closure capture in v1. A function body can read globals and locals only.

### C2: Forward jump patching

`if/else` compilation pattern:

```
compile(condition)
JUMP_IF_ZERO <else_or_end_placeholder>
compile(thenBranch)
JUMP <end_placeholder>          ; only when else exists
<patch else target>
compile(elseBranch)
<patch end target>
```

### C3: Implicit returns

- Every compiled function ends with a guaranteed `RETURN`
- If source has explicit `return`, compiler emits direct `RETURN`
- Functions without explicit return produce `0` only if explicitly chosen; preferred rule is compiler emits error when a path does not return in v1 for pedagogical clarity

Decision: enforce explicit return in tiny-core functions for v1.

### C4: Unsupported-node policy

Compiler should fail fast with clear messages, e.g.:

- `Unsupported in tiny-core v1: WhileStatement`
- `Unsupported in tiny-core v1: anonymous function declaration`

This keeps scope crisp and avoids partial runtime behavior.

## VM Execution Model

### Stack and Frames

```
VM
  operandStack: number[]
  callStack: CallFrame[]
  globals: Map<string, number>

CallFrame
  fn: FunctionProto
  ip: number
  locals: number[]
```

Call protocol:

1. `CALL name, argc` pops `argc` argument values
2. Creates new frame with local array sized to `localCount`
3. Writes arguments into local slots `[0..arity-1]`
4. Executes callee until `RETURN`
5. Pushes return value on caller operand stack

Recursion works naturally because each call has its own frame.

### Control Flow

- `JUMP` sets `ip`
- `JUMP_IF_ZERO` pops condition and jumps when value is `0`

## Diagrams

### Pipeline

```
          existing path (unchanged)
source -> lexer -> parser -> AST -> interpreter

          tiny-core path (new)
source -> lexer -> parser -> AST -> compiler -> bytecode -> VM
```

### Recursive call stack (`fib(4)` shape)

```
top
┌──────────────────────────┐
│ frame fib(n=1)          │
├──────────────────────────┤
│ frame fib(n=2)          │
├──────────────────────────┤
│ frame fib(n=3)          │
├──────────────────────────┤
│ frame fib(n=4)          │
└──────────────────────────┘
bottom
```

## Risks / Trade-offs

- **Semantic split**: VM v1 differs from full language semantics (no strings/closures/scope modes)
  - Mitigation: position tiny-core as explicit subset backend
- **Return discipline friction**: requiring explicit return is stricter than some user expectations
  - Mitigation: clear compiler diagnostics and examples
- **Name-based call limitation**: no first-class function values in v1
  - Mitigation: acceptable for learning-first scope; can evolve in v2

## Validation Strategy

- Reuse parser fixtures and add tiny-core backend execution tests for subset programs
- Golden parity assertions: for tiny-core-compatible programs, VM result equals interpreter result
- Canonical programs:
  - factorial recursion
  - fibonacci recursion
  - branch-based classifier
  - arithmetic with local/global variable usage
