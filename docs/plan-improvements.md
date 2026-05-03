# Lucky Script — Syntax & Design Decisions

Agreed design for the next evolution of the language (Python/Ruby feel).

---

## Blocks

`end` keyword closes all blocks. No `{}` braces. No `do` prefix required.

```
def add(a, b)
  a + b
end

if x > 0
  print(x)
end

while x > 0
  x = x - 1
end
```

---

## Functions

Named: `def name(params) ... end`
Anonymous: `fn(params) body end` — assignable, passable, multiline

```
def double(x)
  x * 2
end

transform = fn(x)
  local y = x * 2
  y + 1
end

numbers.map(double)
numbers.map(fn(x) x * 2 end)
```

---

## Implicit Return

Last expression in a function body is returned automatically. Explicit `return` still valid for early exit.

```
def add(a, b)
  a + b        # returned implicitly
end
```

---

## Scoping

**Lexical scoping.** (Breaking change from current dynamic scoping.)

- `local x = 1` — declares new variable in current scope
- `x = 1` — reassigns existing variable, walks up scope chain
- Loop variables (`for item in ...`) are automatically local

```
x = 1

def foo()
  local y = 2   # new local
  x = 99        # reassigns outer x
end
```

---

## Conditionals

No parentheses around conditions. `elif` / `else` / `end`.

```
if x < 0
  return -1
elif x == 0
  return 0
else
  return 1
end
```

**Strict boolean**: condition must be `true` or `false`. Non-boolean is a type error.

---

## Logical Operators

Word-only. No `&&` / `||` / `!`.

```
if x > 0 and y > 0
  return true
end

if not active
  return null
end
```

---

## Loops

```
while x > 0
  x = x - 1
end

for item in collection
  print(item)
end
```

`break` and `continue` for loop control.

---

## Literals

| Value | Syntax |
|-------|--------|
| Boolean true | `true` |
| Boolean false | `false` |
| Null | `null` |
| Integer | `42`, `1_000_000` |
| Float | `3.14` |
| String | `"hello"` or `'hello'` |
| List | `[1, 2, 3]` |

---

## Strings

Both single and double quotes. F-string interpolation with `{}`:

```
name = "world"
greeting = f"hello {name}"
multi = f"result: {x + y}"
```

Escape sequences: `\n`, `\\`, `\"`, `\'`.

---

## Operators

| Category | Operators |
|----------|-----------|
| Arithmetic | `+`, `-`, `*`, `/`, `**`, `%` |
| Comparison | `<`, `<=`, `==`, `!=`, `>=`, `>` |
| Logical | `and`, `or`, `not` |
| Unary | `-x`, `+x` |

---

## Method Calls (dot-notation)

Objects have built-in methods. No user-defined classes (yet).

```
numbers.length
numbers.push(4)
numbers.map(fn(x) x * 2 end)
names.filter(fn(s) s.length > 3 end)
"hello".upcase
```

---

## Variables

```
x = 1             # reassign existing or create in top scope
local x = 1       # declare new in current scope
```

---

## Print

```
print("hello")        # prints with newline
print(f"x = {x}")
```

---

## Comments

```
# this is a comment
```

---

## Multiline Expressions

Newline inside unclosed brackets `(` `[` is ignored — statement continues:

```
result = someFunction(
  arg1,
  arg2
)

matrix = [
  1, 2, 3,
  4, 5, 6,
]
```

---

## Error Handling (deferred)

Planned syntax after core features (1–6 in plan-next-steps.md) are stable:

```
try
  result = riskyOperation()
catch e
  print(f"Error: {e}")
end
```

---

## Future Ideas

- Compound assignment: `+=`, `-=`, `*=`, `/=`
- User-defined classes / objects
- `p(x)` debug inspect
- Multiline strings