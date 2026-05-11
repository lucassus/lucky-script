# Lucky Script — Roadmap

Ordered by priority. Items higher up are more foundational or higher-leverage; items lower down are ergonomics, polish, or further-out work.

## Summary

**Next** — foundational FP core:

- Lists
- Lambda function shorthand (`x -> x + 1`, `x, y -> x + y`)
- `for-each` loop
- `if` as an expression
- Pattern matching (`match` / `case`)
- Destructuring in assignment and parameters
- Pipeline operator (`|>`)
- Dicts

**Later** — ergonomics, type safety, error handling:

- Dot-notation method calls
- Guard-`if` for early exit
- Strict boolean conditions
- Default argument values
- Keyword arguments
- f-string interpolation
- `%` modulo operator
- `try` / `catch`
- Sets

**Future** — OOP and polish:

- User-defined classes / objects
- `inspect(x)` debug inspect
- Multiline strings

---

## Vision

Lucky Script is a small, functional-first scripting language. Block syntax uses `fun ... end` and `if ... end`; expressions are values; lambdas, pipelines, and pattern matching keep code tight. The examples below mix current syntax with planned features to show the intended end state.

### The basics

```
let greeting = "hello"
let n        = 1 + 2 * 3
let ok       = n > 5 and greeting == "hello"

print(greeting)   # => hello
```

### Functions and closures

```
fun makeCounter()
  let count = 0
  return fun()
    count += 1
    return count
  end
end

let next = makeCounter()
next()   # => 1
next()   # => 2
```

### Conditional expressions and guards

```
# if-expression: produces a value
abs = if x < 0 then -x else x

# guard-if: early exit from a function
fun classify(x)
  return "zero" if x == 0
  return "neg"  if x < 0
  return "pos"
end

# guard-if: early exit from a loop
let i = 0
while true
  i += 1
  break if i >= 10
  print(i)
end
```

### Lists, lambdas, and pipelines

```
let nums = [1, 2, 3, 4, 5]

let doubled   = nums |> map(x -> x * 2)             # => [2, 4, 6, 8, 10]
let positives = nums |> filter(x -> x > 2)          # => [3, 4, 5]
let total     = nums |> reduce((acc, x) -> acc + x, 0)   # => 15
```

### Pattern matching

```
fun describe(value)
  return match value
    case 0            then "zero"
    case n if n < 0   then "negative"
    case []           then "empty"
    case [x]          then f"one: {x}"
    case [x, ...xs]   then f"first {x}, then {xs.length} more"
    case _            then "something else"
  end
end
```

### Destructuring

```
[first, second, ...rest] = [10, 20, 30, 40]
first    # => 10
rest     # => [30, 40]

fun greet({name, age})
  print(f"Hi {name}, you are {age}")
end

greet({name: "Alice", age: 30})
```

### Dicts, dot-methods, and pipelines together

```
people = [
  {name: "Alice", age: 30},
  {name: "Bob",   age: 17},
]

adultNames = people
  |> filter(({age}) -> age >= 18)
  |> map(({name}) -> name)

adultNames.length    # => 1
adultNames[0]        # => "Alice"
```

---

## Next

### Lists

Ordered, indexable collections. List literals use `[...]` syntax; elements are accessed by zero-based integer index with `lst[i]`. Out-of-bounds access raises a runtime error.

Lists are the foundation for `for-each`, pattern matching, destructuring, and higher-order methods like `map` and `filter`.

```
nums = [1, 2, 3]
nums[0]         # => 1
nums[2]         # => 3
```

### Lambda function shorthand

Concise expression-bodied lambdas using `->`. Single parameter omits parens; multiple parameters are comma-separated; zero parameters use empty parens.

```
double = x -> x * 2
add    = x, y -> x + y
const  = () -> 42

nums.map(x -> x * 2)
pairs.map((x, y) -> x + y)   # parens optional but allowed
```

The body is a single expression. For multi-statement bodies, fall back to the block form (`fun(x) ... end`).

**Precedence.** The body has very low precedence and greedily extends to the first `,`, `)`, `]`, `}`, `end`, or newline at the same nesting level. Use parens to limit it.

```
nums.map(x -> x * 2)         # body is x * 2
[x -> x + 1, y -> y - 1]     # list of two lambdas (commas terminate)
```

**Disambiguation.** `x, y -> body` in argument position is a single multi-parameter lambda, not two arguments — the parser uses lookahead and treats a comma-separated identifier list followed by `->` as a parameter list.

### for-each loop

Iterates over every element in a list. The loop variable is bound in the enclosing function/top-level scope (Python-style: it persists and is accessible after the loop ends). Closures capture the variable, not the value at each iteration.

```
total = 0
for item in [10, 20, 30]
  total = total + item
end
total   # => 60
```

### `if` as an expression

`if` evaluates to a value. `else` is **required** in expression position — a missing branch has no value.

```
b = if condition then x else y
a = if condition then x else add(x)

sign = if n < 0 then -1 elseif n == 0 then 0 else 1 end

fun abs(x)
  return if x < 0 then -x else x
end
```

The block form (`if cond then ... end` over multiple lines, with `elseif`/`else`) keeps working unchanged — it just produces a value when used in expression position.

**Precedence.** `if`-expression sits at the lowest precedence (alongside `or`). Greedy parse: the `else` branch consumes as much as it can. Use parens or `end` to cut it short.

```
b = if c then x else y + 1     # parsed as: if c then x else (y + 1)
b = (if c then x else y) + 1   # explicit grouping
```

### Pattern matching

`match` is an expression. Each `case` has a pattern, optional guard (`if expr`), and a body introduced by `then`. The first matching case wins. If no case matches, a runtime error is raised; use `case _` as a catch-all.

```
sign = match n
  case 0 then 0
  case n if n > 0 then 1
  case _ then -1
end

describe = match value
  case []              then "empty"
  case [x]             then f"one: {x}"
  case [x, ...rest]    then f"head {x}, {rest.length} more"
  case {name: n}       then f"named {n}"
  case _               then "other"
end
```

**Patterns.**

- Literals: `0`, `"hello"`, `true`, `false`, `nothing`
- Wildcard: `_` (matches anything, no binding)
- Binding: a bare identifier (matches anything, binds the value to that name)
- List: `[]`, `[a]`, `[a, b]`, `[head, ...tail]`
- Dict: `{key: pattern, ...}`; bare-identifier shorthand `{name}` is equivalent to `{name: name}`

Bindings introduced by a pattern are scoped to that case's guard and body.

### Destructuring in assignment and parameters

The same pattern syntax used by `match` works in assignment and function parameter positions. A shape mismatch (wrong length, missing key, wrong type) is a runtime error.

```
[a, b, c]       = [1, 2, 3]
[head, ...tail] = nums

{name, age}        = person       # shorthand: binds `name` and `age`
{name: n, age: a}  = person       # explicit rebinding

fun first([x, ..._]) x
fun greet({name, age})
  print(f"Hi {name}, you are {age}")
end
```

Destructuring is intentionally a strict subset of `match` patterns — no guards, no literal patterns, no wildcards beyond `_`. If you need conditional logic, use `match`.

### Pipeline operator

`x |> f(a, b)` rewrites to `f(x, a, b)` — the left operand is inserted as the first argument. `x |> f` (without call parens) is sugar for `f(x)`.

```
result = nums
  |> filter(x -> x > 0)
  |> map(x -> x * 2)
  |> sum()
```

**Associativity and precedence.** Left-associative: `a |> f |> g` parses as `g(f(a))`. Lower precedence than every other binary operator, higher than `if`-expression and lambda body.

```
total = xs |> filter(x -> x > 0) |> sum()   # whole chain
total = (xs |> filter(...)) + 1             # parens to mix with arithmetic
```

### Dicts

Key-value collections. Dict literals use `{...}` syntax with `key: value` pairs. Keys are strings — bare identifiers in key position are treated as string literals, not variable lookups. Values can be any expression. Elements are accessed and mutated with the same subscript operator used by lists.

```
person = { "name": "Alice", age: 30 }
person["name"]          # => "Alice"
person["age"]           # => 30
person["role"] = "admin"

empty = {}
```

`{}` is always an empty dict, never an empty set (see Sets below).

---

## Later

### Dot-notation method calls

Built-in methods on lists, strings, and dicts via dot syntax. No user-defined classes here — methods are intrinsic to each type.

```
nums = [1, 2, 3]
nums.length                  # => 3
nums.map(x -> x * 2)         # => [2, 4, 6]
nums.filter(x -> x > 1)      # => [2, 3]

"hello".upcase                   # => "HELLO"
"hello".length                   # => 5
```

### Guard-if for early exit

Postfix `if` is allowed on `return`, `break`, and `continue` only. It has **no `else`** — when the condition is false, control falls through to the next statement.

```
fun classify(x)
  return nothing if x == nothing
  return 0       if x == 0
  return -x      if x < 0
  return compute(x)
end

i = 0
while i <= 10
  i += 1
  continue if i == 3
  break    if i == 7
  print(i)
end
```

**Rules.**

- Guard-`if` is only valid on `return` / `break` / `continue`. Not on assignments or expression statements.
- Guard-`if` never carries `else`. The instant `else` appears, it's an `if`-expression.
- A single statement can use either form, never both. `return if a then b else c if d` is a parse error.
- The guard binds to the whole statement: `return f(x) + g(x) if cond` returns the full sum, conditionally.

**Disambiguation.** The parser decides between expression-`if` and guard-`if` by the position of `if`:

| Position of `if`                                 | Form            | Has `else`? |
| ------------------------------------------------ | --------------- | ----------- |
| First token after `=` / `return` / argument slot | expression-`if` | required    |
| After a complete expression                      | guard-`if`      | forbidden   |

### Strict boolean conditions

`if` and `while` conditions must evaluate to `true` or `false`. Passing any other type (number, string, list) is a type error. This removes truthiness/falsiness and makes type errors visible early.

```
if x > 0        # ok — comparison yields boolean
  ...
end

if x            # TypeError: condition must be boolean, got Number
  ...
end
```

### Default argument values

Parameters can declare a default expression, used when the caller omits that argument. Defaults are evaluated at call time, not definition time — each call that uses a default gets a fresh evaluation. Required parameters must come before parameters with defaults.

```
fun greet(name, greeting = "Hello")
  print(greeting + ", " + name)
end

greet("Alice")           # => Hello, Alice
greet("Alice", "Hi")     # => Hi, Alice

fun repeat(value, times = 2)
  i = 0
  while i < times
    print(value)
    i += 1
  end
end

repeat("ha")             # prints "ha" twice
repeat("ha", 4)          # prints "ha" four times
```

Omitting a required argument (one without a default) is a runtime error.

### Keyword arguments

Arguments can be passed by name at the call site. Keyword arguments can appear in any order and may be mixed with positional arguments — positional arguments must come first. Works naturally with default values: keyword args let callers skip over defaults they don't want to override.

```
fun connect(host, port = 80, secure = false)
  ...
end

connect("example.com")                        # positional only
connect("example.com", secure=true)           # skip port, override secure
connect("example.com", port=443, secure=true) # all keyword
connect("example.com", 443, secure=true)      # mixed: positional then keyword
```

Passing the same parameter both positionally and by name is a runtime error. Passing an unknown keyword is a runtime error.

### f-string interpolation

String interpolation with `f"..."` syntax. Any expression can appear inside `{}`. Single-quoted strings are also supported.

```
name = "world"
print(f"hello {name}")       # => hello world
print(f"result: {x + y}")    # => result: 42
print(f'also works: {name}') # => also works: world
```

### `%` modulo operator

Adds `%` as an arithmetic operator with the same precedence as `*` and `/`.

```
10 % 3   # => 1
7 % 2    # => 1
```

### try / catch

Structured error handling. The `catch` clause binds the error to a variable in a new scope. Runtime errors (index out of bounds, type errors, scope errors, failed destructure, non-exhaustive `match`) are catchable.

Deferred until lists, pattern matching, and destructuring are stable, because those features introduce the most common runtime errors worth catching.

```
try
  result = nums[99]
catch e
  print(f"Error: {e}")
end
```

### Sets

Unordered collections of unique values. Set literals use `{...}` with comma-separated elements and **no colons**. The parser disambiguates by whether the first element is followed by `:` (dict) or `,` / `}` (set).

```
primes = {2, 3, 5, 7}
primes = {2, 3, 5, 7, 3}   # => {2, 3, 5, 7}  duplicates dropped silently

singleton = {42}            # set with one element
```

Because `{}` is reserved for empty dict, an empty set requires a builtin: `set()`.

---

## Future

### User-defined classes / objects

Struct-like objects with named fields and methods. Syntax and semantics TBD. Pattern matching should extend to class instances (`case Point(x, y) then ...`) once they exist.

### `inspect(x)` debug inspect

A debug-inspect built-in that prints the type and representation of any value, distinct from `print` which formats for human output.

### Multiline strings

---

## Learning Substrate (`src/simplified/`)

A separate, deliberately small subset of Lucky Script for exploring alternative implementation techniques — hand-written lexers, Pratt parsers, bytecode virtual machines — without the complexity of the full language pipeline.

The subset is specified as a **chain of Ohm grammars**, each inheriting from the previous via `<:`. The Ohm grammar at each stage acts as the reference oracle: any hand-written implementation must match it.

### Stage hierarchy

| Stage | Grammar | Adds |
|---|---|---|
| 1 — Core arithmetic | `ArithmeticCore` | numbers, `+` `-` `*` `/` `**`, parentheses, unary `+`/`-` |
| 2 — Variables | `ArithmeticVars <: ArithmeticCore` | `let`, identifiers, bare assignment |
| 3 — Functions | `ArithmeticFunctions <: ArithmeticVars` | `fun`, `return`, function calls |
| 4 — Full simplified | `ArithmeticFull <: ArithmeticFunctions` | `if/else`, comparisons, `and`/`or`/`not`, `%`, comments |

All four grammars live in one `.ohm` file, loaded together via `ohm.grammars()`. Each is independently testable — stage N tests only need the stage N grammar, not the full chain.

### Learning goals by stage

- **Stage 1** — recursive-descent or Pratt parser for a pure expression grammar; first bytecode VM with arithmetic instructions.
- **Stage 2** — symbol tables; `LOAD`/`STORE` VM instructions; variable scoping.
- **Stage 3** — call frames; `CALL`/`RETURN` VM instructions; function arity checking.
- **Stage 4** — conditional branching; `JUMP`/`JUMP_IF_FALSE` VM instructions; logical short-circuit.

### Syntax alignment

The stage grammars use Lucky Script syntax throughout (`**` for power, `#` for comments, `fun … end`, `let`). The existing `src/simplified/grammar.ohm` (`Arithmetic`) predates this plan and diverges in places (`^`, `//` comments) — it stays as-is; the new stage hierarchy is additive.

---

## Decisions

### `do` / `then` stay optional inline separators

Considered making `do` (for `fun` and `while`) and `then` (for `if`) mandatory block-openers. Rejected: the multi-line form is unambiguous without them, so requiring them is pure verbosity tax. Current rule kept:

- Multi-line: no separator needed.
- Inline: `do`/`then` disambiguates header from body — `while ready do tick() end`, `if x > 0 then print(x) end`.
- Functions: never need `do`. The newline-vs-expression rule already distinguishes short-form lambdas (`fun(x) x * 2`) from block functions.

### Postfix `if` with `else` (Python-style ternary)

Considered allowing `x if cond else y` as an expression form, alongside `if cond then x else y`. Rejected: it duplicates expression-`if` with no added power, forces every reader and writer to learn two equivalent forms, and creates parser ambiguity when combined with guard-`if`.

```
return x if x == 0 else add(x)         # rejected
return if x == 0 then x else add(x)    # use this instead
```

The guard form (`return x if cond`, no `else`) is kept — it's a different feature with a clear use case (early exit) and no overlap with expression-`if`.

### General statement-modifier `if`

Considered Ruby-style postfix `if` on any statement (`x = 5 if cond`, `print(x) if debug`, `foo() if ready`). Rejected: it makes side effects easy to bury behind a trailing condition, and grows into a stylistic religion in any codebase with more than one author.

Guard-`if` is restricted to `return`, `break`, and `continue` — statements whose only effect is control flow. Extension to other statements can be revisited if a concrete need shows up.

### `unless` keyword

Considered shipping `unless` as a complement to `if` (`return x unless ready`). Rejected: doubles the keyword surface for negated conditions, and `if not ready` covers the same ground without forcing a vocabulary choice on every reader.
