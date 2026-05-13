-- ============================================================
-- Lucky Script Inspirations — Lua
-- ============================================================
-- Assumed: Lua 5.4.
-- See ../roadmap.md for Lucky Script's feature roadmap.
--
-- Lua is LS's closest design cousin: `do ... end`, `then ... end`,
-- dynamic typing, no semicolons, a tiny core. LS borrowed Lua's
-- block syntax. The interesting divergences are in scoping
-- (Lua's `local` keyword), tables-as-everything, and multiple
-- return values.
--
-- Sections:
--   01. Comments & program structure
--   02. Variables & assignment
--   03. Numbers, booleans, nil
--   04. Strings
--   05. Operators
--   06. if / elseif / else
--   07. while, repeat, break (no continue!)
--   08. for-each (numeric & generic)
--   09. Functions, closures, varargs
--   10. Anonymous functions (no shorthand)
--   11. Higher-order functions & "pipelines"
--   12. Arrays (1-indexed tables)
--   13. Dicts (string-keyed tables)
--   14. Sets (table with truthy values)
--   15. "Pattern matching" via if-elseif chains
--   16. Error handling (pcall / error)
--   17. Methods on types (dot vs colon call)
--   18. Inspect / debug
--   19. Beyond LS: metatables, coroutines, multiple return values
-- ============================================================


-- ============================================================
-- 01. Comments & program structure
--   LS: shipped (# comments). Lua uses `--` and `--[[ ]]`.
-- ============================================================

-- Single-line: --
--[[
  Block comment.
  Can span lines.
--]]


-- ============================================================
-- 02. Variables & assignment
--   LS: shipped. Lua's twist: `local` makes a binding LOCAL; undeclared
--   assignment writes to the GLOBAL table. LS chose declaration-required
--   with `let` for clearer scoping — a similar tradeoff to Lua's `local`.
-- ============================================================

local x = 10
x = 20                  -- rebind the local

x = x + 5               -- Lua has no `+=`
x = x * 2

-- Parallel multi-assignment — Lua has had it forever.
local a, b = 1, 2
a, b = b, a             -- idiomatic swap

-- Extra targets get `nil`; extra values are discarded.
local p, q, r = 1, 2    -- r is nil
local s, t = 1, 2, 3    -- 3 is discarded


-- ============================================================
-- 03. Numbers, booleans, nil
--   LS: shipped. Lua 5.3+ distinguishes integer and float internally.
-- ============================================================

local n = 1000000        -- Lua has no `_` digit separators
local pi = 3.14159
local hex = 0xff

local t_ = true
local f_ = false
local nothing = nil      -- Lua's "nothing"

-- Only `nil` and `false` are falsy. 0, "", {} are all truthy — same
-- as Ruby, opposite of Python. LS chose Python-like truthiness.


-- ============================================================
-- 04. Strings
--   LS: shipped (escapes, concat). f-strings planned (Later);
--   multiline planned (Future). Lua: `..` for concat, `[[ ]]` for multiline.
-- ============================================================

local greeting = "hello"
local name = "world"
print(greeting .. " " .. name)        -- `..` is string concatenation

print("say \"hi\"")
print("line1\nline2")
print('single quotes work too')

-- Lua has no interpolation. `string.format` is the idiom — printf-style.
print(string.format("hello %s, you are %d", name, 30))

-- Long brackets [[ ... ]] for multi-line, no escape interpretation.
local multi = [[
  line 1
  line 2
]]


-- ============================================================
-- 05. Operators
--   LS: shipped. Lua adds `//` (integer divide) and `%` (modulo).
-- ============================================================

print(1 + 2 * 3 ^ 2)     -- `^` is exponentiation in Lua, NOT XOR
print(10 % 3)             -- modulo
print(10 // 3)            -- integer division (5.3+)
print(10 / 3)             -- float division

-- Comparison: `==` and `~=` (not `!=`).
print(1 == 1)
print(1 ~= 2)

-- Boolean: `and`, `or`, `not` — short-circuit, return the value not bool.
print(true and false)
print(true or false)
print(not true)

-- Common idiom: `x or default` for fallbacks.
local greeting2 = nil or "Hello"
print(greeting2)         -- "Hello"


-- ============================================================
-- 06. if / elseif / else
--   LS: shipped (statement). if-expression planned (Next) —
--   Lua has no if-expression; `cond and t or f` is the idiom (with a
--   pitfall: t must not be falsy, or you get f instead).
-- ============================================================

local function classify(value)
  if value < 0 then
    return -1
  elseif value == 0 then
    return 0
  else
    return 1
  end
end

local abs_value = (x < 0) and -x or x


-- ============================================================
-- 07. while, repeat, break (no continue!)
--   LS: shipped (while/break/continue). Lua famously has NO `continue` —
--   use `goto` or restructure. Guard-if planned (Later) — Lua has no
--   postfix `if`.
-- ============================================================

local i = 0
while i < 10 do
  i = i + 1
  if i == 3 then
    goto continue        -- Lua's continue: labeled goto
  end
  if i == 7 then break end
  print(i)
  ::continue::
end

-- `repeat ... until cond` — runs at least once, exits when cond is true.
-- Note: the until-expression CAN see locals declared in the body.
local j = 0
repeat
  j = j + 1
until j >= 3


-- ============================================================
-- 08. for-each (numeric & generic)
--   LS: planned (Next). Lua has two for forms.
-- ============================================================

-- Numeric for: start, stop (inclusive), [step].
for k = 1, 5 do
  print(k)
end
for k = 10, 0, -2 do
  print(k)
end

-- Generic for: drives off an iterator function. `ipairs` for arrays
-- (1..n in order), `pairs` for arbitrary tables.
local nums = { 10, 20, 30 }
local total = 0
for _, item in ipairs(nums) do
  total = total + item
end

local person = { name = "Alice", age = 30 }
for key, value in pairs(person) do
  print(key, value)
end


-- ============================================================
-- 09. Functions, closures, varargs
--   LS: shipped (functions, closures). Defaults & kwargs planned (Later) —
--   Lua has neither natively; idioms below.
-- ============================================================

local function add(a, b)
  return a + b
end

-- Pseudo-defaults via `or`.
local function greet(person, greeting)
  greeting = greeting or "Hello"
  print(greeting .. ", " .. person)
end
greet("Alice")
greet("Alice", "Hi")

-- Pseudo-kwargs via a single table argument — Lua's idiomatic answer.
local function connect(opts)
  local host = opts.host
  local port = opts.port or 80
  local secure = opts.secure or false
  print(host, port, secure)
end
connect({ host = "example.com", secure = true })

-- Varargs: `...` collects extra args; `select`/`table.pack` operate on them.
local function variadic(...)
  local args = { ... }
  print(#args, args[1], args[2])
end
variadic(1, 2, 3)

-- Closures.
local function make_counter()
  local count = 0
  return function()
    count = count + 1
    return count
  end
end

local counter = make_counter()
print(counter(), counter())   -- 1 2


-- ============================================================
-- 10. Anonymous functions (no shorthand)
--   LS: shipped (full-form `fun(x) x*2`). Arrow shorthand `x -> x*2`
--   planned (Next) — Lua has no shorthand; `function(x) return x*2 end`.
-- ============================================================

local double = function(x) return x * 2 end
local add_xy = function(x, y) return x + y end
local const = function() return 42 end


-- ============================================================
-- 11. Higher-order functions & "pipelines"
--   LS: HOFs work today. Pipeline `|>` planned (Next) — Lua has no `|>`
--   and no built-in map/filter; you write them yourself (small core).
-- ============================================================

local function map(arr, fn)
  local out = {}
  for i, v in ipairs(arr) do out[i] = fn(v) end
  return out
end

local function filter(arr, pred)
  local out = {}
  for _, v in ipairs(arr) do
    if pred(v) then out[#out + 1] = v end
  end
  return out
end

local function reduce(arr, fn, init)
  local acc = init
  for _, v in ipairs(arr) do acc = fn(acc, v) end
  return acc
end

local sample = { 1, 2, 3, 4, 5 }
print(reduce(map(filter(sample, function(v) return v > 0 end),
                 function(v) return v * 2 end),
             function(acc, v) return acc + v end, 0))


-- ============================================================
-- 12. Arrays (1-indexed tables)
--   LS: planned (Next, 0-indexed). Lua tables-as-arrays are 1-indexed.
--   `#t` gives the length but is only well-defined for "sequence" tables.
-- ============================================================

local arr = { 10, 20, 30, 40, 50 }
print(arr[1], arr[#arr])      -- first and last; note 1-indexing
table.insert(arr, 60)         -- append
table.remove(arr, 1)          -- remove head
print(#arr)


-- ============================================================
-- 13. Dicts (string-keyed tables)
--   LS: planned (Next). In Lua, arrays and dicts share one type: table.
--   `{ name = "Alice" }` is shorthand for `{ ["name"] = "Alice" }`.
-- ============================================================

local person = { name = "Alice", age = 30 }
print(person.name)
print(person["name"])         -- equivalent
person.role = "admin"
person["age"] = 31
person.role = nil             -- "delete" by assigning nil


-- ============================================================
-- 14. Sets (table with truthy values)
--   LS: planned (Later). Lua has NO native set; the idiom is a table
--   where keys are elements and values are `true`. Same approach LS will
--   face once `{}` is reserved for empty dict.
-- ============================================================

local primes = { [2] = true, [3] = true, [5] = true, [7] = true }
primes[11] = true             -- "add"
print(primes[2] == true)      -- "has"
primes[3] = nil               -- "remove"


-- ============================================================
-- 15. "Pattern matching" via if-elseif chains
--   LS: planned (Next). Lua has no `match` keyword; the idiom is an
--   `if/elseif` chain with manual type-and-shape checks.
-- ============================================================

local function describe(value)
  if value == 0 then
    return "zero"
  elseif type(value) == "number" and value < 0 then
    return "negative"
  elseif type(value) == "table" and #value == 0 then
    return "empty"
  elseif type(value) == "table" and #value == 1 then
    return "one: " .. tostring(value[1])
  elseif type(value) == "table" then
    return "first " .. tostring(value[1]) .. ", then " .. tostring(#value - 1) .. " more"
  elseif type(value) == "table" and value.name then
    return "named " .. value.name
  else
    return "other"
  end
end

-- Destructuring is just parallel-assignment from indexed access.
local pair = { 1, 2 }
local da, db = pair[1], pair[2]


-- ============================================================
-- 16. Error handling (pcall / error)
--   LS: planned (Later) — try/catch. Lua uses `error` to raise and
--   `pcall` ("protected call") to catch.
-- ============================================================

local ok, err = pcall(function()
  if arr[99] == nil then error("out of bounds") end
end)
if not ok then
  print("caught: " .. tostring(err))
end

-- `xpcall` adds a message handler — useful for stack-trace capture.

local function must_be_positive(value)
  if value < 0 then error({ kind = "AppError", msg = "negative: " .. value }) end
  return value
end


-- ============================================================
-- 17. Methods on types (dot-call)
--   LS: planned (Later). Lua method-call uses `:` not `.` — `s:upper()`
--   is sugar for `string.upper(s)`. Big design decision: methods are
--   functions in a table looked up via the metatable.
-- ============================================================

print(("hello"):upper())
print(("hello"):gsub("l", "L"))
print(("  pad  "):gsub("^%s+", ""):gsub("%s+$", ""))  -- trim via patterns
print(table.concat({ "a", "b", "c" }, ","))
print(string.find("a,b,c", ","))


-- ============================================================
-- 18. Inspect / debug
--   LS: planned (Future). Lua: `tostring`, `type`, plus the `debug` lib.
-- ============================================================

local xx = { 1, 2, 3 }
print(tostring(xx))            -- "table: 0x..."
print(type(xx))                -- "table"
-- No built-in pretty-printer; `inspect.lua` is the common third-party choice.


-- ============================================================
-- 19. Beyond Lucky Script — Lua gems
--   LS: not planned.
-- ============================================================

-- --- Metatables: Lua's whole OOP / operator-overload story ---
-- A table can have a *metatable* that overrides behaviors via metamethods.
-- `__index` is consulted for missing keys — this is how inheritance works.

local Point = {}
Point.__index = Point

function Point.new(x, y)
  local self = setmetatable({}, Point)
  self.x, self.y = x, y
  return self
end

function Point:distanceTo(other)
  return math.sqrt((self.x - other.x) ^ 2 + (self.y - other.y) ^ 2)
end

function Point.__add(a, b)         -- operator overload for `+`
  return Point.new(a.x + b.x, a.y + b.y)
end

function Point.__tostring(p)
  return string.format("Point(%g, %g)", p.x, p.y)
end

local p1 = Point.new(1, 2)
local p2 = Point.new(3, 4)
print(p1 + p2)                     -- triggers __add then __tostring
print(p1:distanceTo(p2))           -- method call uses :


-- --- Coroutines: cooperative concurrency primitives ---
-- coroutine.create makes a coroutine, .resume runs it, .yield pauses it.
-- Useful for generators, async control flow, and iterators.

local function counter_coroutine(limit)
  for k = 1, limit do
    coroutine.yield(k)
  end
end

local co = coroutine.create(function() counter_coroutine(3) end)
print(coroutine.resume(co))        -- true, 1
print(coroutine.resume(co))        -- true, 2
print(coroutine.resume(co))        -- true, 3
print(coroutine.resume(co))        -- true   (returned)

-- Generic-for can drive a coroutine directly via `coroutine.wrap`.
local function range(stop)
  return coroutine.wrap(function()
    for k = 1, stop do coroutine.yield(k) end
  end)
end
for k in range(3) do print(k) end


-- --- Multiple return values: not a tuple, just "many values on the stack" ---
local function divmod(a, b)
  return a // b, a % b           -- TWO values, not a table
end

local quot, rem = divmod(17, 5)
print(quot, rem)                  -- 3, 2

-- Calls in the middle of an expression list keep only the FIRST value;
-- calls at the END keep all values. A surprising design rule:
local t = { divmod(17, 5) }       -- t = { 3, 2 }  (last in list: keeps all)
local u = { divmod(17, 5), 99 }   -- u = { 3, 99 } (not last: drops 2)
print(#t, #u)
