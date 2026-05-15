- [ ] Consider drop `do` keyword for function declaration

```
# Function declatation
fun add(a, b) do
  return a + b
end

let sub = fun(a, b) do
  return a - b
end

# Some variables
let a = 1
let b = add(a, 2)
let c = sub(a, b)

fun make_counter(initial) do
  let counter = initial
  
  fun increment() do
    counter = counter + 1
    return counter
  end
  
  return increment
  
  # Alternativelly
  return fun() do
    coutner += 1
    return counter
  end
end

# Expression first
let x = if a < then "negative" else "positive"

while i < 5 do
  i = i + 1
  print(i)
end

# lambda expression
let double = fun(x) x * 2

if condition and (a < 0 or a > 1) then
elseif
else
end

# right-associative
2 ** 3 ** 2  # 512, same as 2 ** (3 ** 2)
```

Variable scopes
```
let x = 1
let x = 2 # ScopeError
x = 2 # ok

let x = 1
fun f() do
  let x = 2 # New scope
end

let x = 1
fun f() do
  x = 2 # ok, updates the nearest existing binding
end
```

Guard suffixes
```
return "zero" if x == 0
break if i >= 10

x = -x if x < 0
```

Single line blocks
```
if x > 0 then return x end
while true do break end
```

```
if nothing and true   # false
if nothing or true    # true
if not nothing        # true
if 1 and true         # TypeError
if "" or false        # TypeError
```

Future
```
for item in items do
end
```

```
map(items, fun(x) x * 2)
filter(items, fun(x) x > 2)

# vs
items.map(fun(x) x ** 2).filter(fun(x) x > 2)
```

```
let items = [1, 2, 3]
items[0]
items[1] = 4

let user = { "name": "Ada", "age": 36 }
user["name"]
user["age"] = 16
```

```
let more = [0, ...nums, 4]

let defaults = {"theme": "dark", "size": 10}
let config = {...defaults, "size": 12}
```

Default params
```
# Defaults only after required params
fun inc(a, b = 1) do
  return a + b
end

let a = 0
inc(1)
inc(1, 10)

fun repeat(text, n = 1, suffix = test) do
end

fun sum(...items) do
end

fun log(prefix, ...values) do ... end

let nums = [1, 2, 3]
sum(...nums)
```

Pattern matching
```
let label = match value
  case 0 then "zero"
  case nothing then "missing"
  case _ then "other"
end
```

```
let [first, second] = pair
```

Not allowed syntax
```
let a = fun b() do
  retrurn nothing
end

return 1 # SyntaxError (outside fun declaration)


x = 1 if 1 # TypeError
```

No assigment chaining
```
x = y = 1
# ...should be explicit
let x = 1
let y = 1
```

```
let x = 1
x += 1 # ok
y += 1 # NameError

let += 1 # SyntaxError
```

```
while true do
  fun f() do break end
  f() # SyntaxError, function boundary blocks it
end

# Corrected example
while true do
  fun f() return true end
  break if f()
end
```