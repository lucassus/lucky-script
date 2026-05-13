# ============================================================
# Lucky Script Inspirations — Elixir
# ============================================================
# Assumed: Elixir 1.16+.
# See ../roadmap.md for Lucky Script's feature roadmap.
#
# Elixir is probably the strongest single inspiration for LS's roadmap
# end-state: `|>` is everywhere, pattern matching is THE control flow,
# functions are first-class, immutability is the default, and the
# `do ... end` blocks (LS borrowed the shape) are first-class syntax.
# If you take only one file from this set seriously, take this one.
#
# Sections:
#   01. Comments & program structure
#   02. Variables & assignment (rebinding vs immutability)
#   03. Numbers, booleans, nil, atoms
#   04. Strings (interpolation + sigils)
#   05. Operators
#   06. if / cond / unless (and why `cond` exists)
#   07. while-style: there isn't one (use recursion or Enum)
#   08. for-each (Enum.each, comprehensions)
#   09. Functions (named, anonymous, multiple-clause)
#   10. Anonymous function shorthand
#   11. Pipelines — Elixir is the design reference for LS's `|>`
#   12. Lists (linked, immutable, head/tail)
#   13. Maps & keyword lists
#   14. Sets (MapSet)
#   15. Pattern matching everywhere
#   16. Error handling (with, try, tagged tuples)
#   17. Methods on types (Module.fun-style; no dot-call yet)
#   18. Inspect / debug
#   19. Beyond LS: processes, with, sigils, protocols
# ============================================================


# ============================================================
# 01. Comments & program structure
#   LS: shipped (# comments). Elixir uses # like LS.
# ============================================================

# Single-line: #. No block comment syntax; multi-line @doc strings exist
# for documentation but aren't general-purpose block comments.


# ============================================================
# 02. Variables & assignment (rebinding vs immutability)
#   LS: shipped. Elixir TWIST: `=` is the *match operator*, not assignment.
#   Variables can be rebound, but data is immutable.
# ============================================================

x = 10
x = 20             # this is REBINDING the variable name x, not mutation
                    # the value 10 was never mutated.

# Match operator: if LHS is a pattern, it matches against RHS.
# Plain variable on the LHS always succeeds (and binds/rebinds).
{a, b} = {1, 2}     # destructures a tuple — pattern match
[head | tail] = [1, 2, 3, 4]   # head=1, tail=[2,3,4]

# `^` (pin) means "use the existing value, don't rebind".
y = 5
# ^y = 6           # would fail — y is 5, 6 doesn't match


# ============================================================
# 03. Numbers, booleans, nil, atoms
#   LS: shipped. Elixir adds ATOMS — interned identifiers. LS could
#   adopt atoms for symbolic enum-like values (see Ruby symbols).
# ============================================================

n = 1_000_000
pi = 3.14159
big = 10_000_000_000_000_000_000   # arbitrary-precision Integer

t = true
f = false
nothing = nil

# Atoms — constants whose value is their own name. Used pervasively
# as tags, keys, status markers. `:ok`, `:error`, `:active`.
status = :active
:atoms_are_just_names

# Falsy: only `nil` and `false`. Everything else (including 0, "", []) is truthy.


# ============================================================
# 04. Strings (interpolation + sigils)
#   LS: shipped (escapes, concat). f-strings planned (Later);
#   multiline planned (Future). Elixir has both; plus sigils.
# ============================================================

greeting = "hello"
name = "world"
IO.puts(greeting <> " " <> name)     # `<>` is binary/string concat

IO.puts("say \"hi\"")
IO.puts("line1\nline2")

# Interpolation — "#{expr}" inside double-quoted strings.
IO.puts("hello #{name}")
IO.puts("sum is #{1 + 2}")

# Heredocs for multi-line, with """ ... """.
multi = """
  line 1
  line 2
"""

# Sigils — short syntax for typed literals. See §19.
words = ~w[alpha beta gamma]    # ["alpha", "beta", "gamma"]


# ============================================================
# 05. Operators
#   LS: shipped. Elixir: `**` for power (Elixir 1.13+), `rem`/`div`
#   for integer arithmetic, `==`/`!=` and `===`/`!==`.
# ============================================================

IO.puts(1 + 2 * 3 ** 2)
IO.puts(rem(10, 3))             # modulo via function call
IO.puts(div(10, 3))             # integer division
IO.puts(10 / 3)                 # always float division

IO.puts(true and false)
IO.puts(true or false)
IO.puts(not true)

# `and`/`or`/`not` require booleans; `&&`/`||`/`!` work with truthy values.
IO.puts(nil || "default")        # short-circuit on falsy — common idiom


# ============================================================
# 06. if / cond / unless (and why `cond` exists)
#   LS: shipped (statement). if-expression planned (Next) — Elixir's
#   `if`/`cond`/`case` ARE all expressions already.
# ============================================================

classify = fn value ->
  if value < 0 do
    -1
  else
    if value == 0, do: 0, else: 1
  end
end

# `cond` matches a sequence of conditions — first truthy wins. Use when
# you want `else-if` style without nesting.
classify2 = fn value ->
  cond do
    value < 0  -> -1
    value == 0 -> 0
    true       -> 1     # the "else" — a literal `true` is conventional
  end
end

# `unless` is sugar for `if not` (LS deliberately rejected this — see roadmap).
IO.puts(unless nil, do: "ok")


# ============================================================
# 07. while-style: there isn't one (use recursion or Enum)
#   LS: shipped (while/break/continue). Elixir is purely FP — NO `while`,
#   NO `break`, NO `continue`. You either recurse or use Enum/Stream.
# ============================================================

# Idiomatic recursion in a module (anonymous functions can recurse via
# the `Recursive` trick or by carrying themselves as args; for clean
# recursion, you write a module — see below).

defmodule Loop do
  def count_to(n), do: count_to(0, n)

  defp count_to(i, n) when i >= n, do: :done
  defp count_to(i, n) do
    IO.puts(i)
    count_to(i + 1, n)
  end
end

Loop.count_to(5)

# Enum.reduce_while gives break-like control: the accumulator is
# `{:cont, acc}` to continue or `{:halt, acc}` to stop.
result =
  Enum.reduce_while(1..10, 0, fn i, acc ->
    if i > 5, do: {:halt, acc}, else: {:cont, acc + i}
  end)

IO.inspect(result)


# ============================================================
# 08. for-each (Enum.each, comprehensions)
#   LS: planned (Next). Elixir: Enum.each for side effects; `for`
#   comprehensions for transforming.
# ============================================================

Enum.each([10, 20, 30], fn item -> IO.puts(item) end)

# `for` comprehension: not a for-loop, it's a generator/filter form.
# Result is a new collection.
squares = for x <- 1..5, do: x * x
IO.inspect(squares)              # [1, 4, 9, 16, 25]

# Multiple generators + filters + `into:` target.
pairs =
  for x <- 1..3,
      y <- 1..3,
      x != y,
      do: {x, y}
IO.inspect(pairs)


# ============================================================
# 09. Functions (named, anonymous, multiple-clause)
#   LS: shipped (functions, closures). Defaults & kwargs planned (Later).
#   Elixir functions can have MULTIPLE CLAUSES dispatched by pattern.
# ============================================================

defmodule MathLib do
  def add(a, b), do: a + b

  # Default args — `\\` syntax. Evaluated at call time.
  def greet(name, greeting \\ "Hello") do
    IO.puts("#{greeting}, #{name}")
  end

  # Multiple clauses — dispatch via pattern matching.
  def factorial(0), do: 1
  def factorial(n) when n > 0, do: n * factorial(n - 1)

  # Guards filter clauses with a restricted set of expressions.
  def kind(x) when is_integer(x), do: :int
  def kind(x) when is_binary(x), do: :string
  def kind(_), do: :other
end

MathLib.greet("Alice")
MathLib.greet("Alice", "Hi")
IO.inspect(MathLib.factorial(5))


# ============================================================
# 10. Anonymous function shorthand
#   LS: shipped (full-form). Arrow shorthand `x -> x*2` planned (Next).
#   Elixir has TWO anonymous-function syntaxes; the `&` shorthand is
#   the closest cousin to LS's planned `x -> x*2`.
# ============================================================

double = fn x -> x * 2 end
add_xy = fn x, y -> x + y end

# `&(...)` shorthand: `&1`, `&2` are positional captures.
double2 = &(&1 * 2)
add_xy2 = &(&1 + &2)

# `&Module.fun/arity` captures a named function as an anonymous one.
upper = &String.upcase/1

IO.puts(double.(3))         # note the dot before call parens
IO.puts(upper.("hello"))


# ============================================================
# 11. Pipelines — Elixir is the design reference for LS's `|>`
#   LS: planned (Next) — pipeline operator. Elixir was the language
#   that popularized `|>` for general use. `x |> f(a, b)` is `f(x, a, b)`.
# ============================================================

nums = [1, 2, 3, 4, 5]

result =
  nums
  |> Enum.filter(fn v -> v > 0 end)
  |> Enum.map(&(&1 * 2))
  |> Enum.sum()

IO.inspect(result)

# The whole module surface is designed around "first arg = the data"
# so pipelines compose naturally. LS's roadmap explicitly inherits this.


# ============================================================
# 12. Lists (linked, immutable, head/tail)
#   LS: planned (Next). Elixir lists are linked lists — O(1) prepend,
#   O(n) index. Pattern-match head/tail is idiomatic.
# ============================================================

list = [1, 2, 3, 4, 5]
[head | tail] = list                  # head=1, tail=[2,3,4,5]
new_list = [0 | list]                 # prepend (O(1))

# Index access is O(n) and unidiomatic — uses Enum.at.
IO.inspect(Enum.at(list, 2))
IO.inspect(length(list))


# ============================================================
# 13. Maps & keyword lists
#   LS: planned (Next). Elixir distinguishes:
#     - Map: %{} — true key-value, any key type, O(log n).
#     - Keyword list: [key: value, ...] — list of {atom, value} tuples,
#       ordered, allows duplicates. Used for "options" args.
# ============================================================

person = %{name: "Alice", age: 30}    # atom keys via shorthand
IO.inspect(person.name)               # dot access for atom keys
IO.inspect(person[:age])              # bracket access

# Update via the | syntax — produces a NEW map (immutable).
older = %{person | age: 31}

# String-keyed map needs the => fat arrow.
str_keyed = %{"name" => "Alice", "age" => 30}
IO.inspect(str_keyed["name"])

# Keyword list — used as the "kwargs" idiom.
opts = [host: "example.com", port: 443]
IO.inspect(opts[:host])


# ============================================================
# 14. Sets (MapSet)
#   LS: planned (Later). Elixir's MapSet has no literal — function calls
#   only. LS will face the same choice (literal vs constructor).
# ============================================================

primes = MapSet.new([2, 3, 5, 7])
primes = MapSet.put(primes, 11)         # rebind — immutable
IO.inspect(MapSet.member?(primes, 2))
IO.inspect(MapSet.size(primes))


# ============================================================
# 15. Pattern matching everywhere
#   LS: planned (Next). In Elixir, pattern matching is fundamental
#   to nearly every construct — `=`, `case`, function clauses, `with`,
#   `receive`. This is the most thoroughly pattern-matched language
#   in the set after Haskell.
# ============================================================

describe = fn value ->
  case value do
    0                   -> "zero"
    n when is_integer(n) and n < 0 -> "negative"
    []                  -> "empty"
    [x]                 -> "one: #{x}"
    [x | rest]          -> "first #{x}, then #{length(rest)} more"
    %{name: name}       -> "named #{name}"
    _                   -> "other"
  end
end

IO.puts(describe.([1, 2, 3]))


# ============================================================
# 16. Error handling (with, try, tagged tuples)
#   LS: planned (Later) — try/catch. Elixir has BOTH styles:
#     1. Tagged tuples: `{:ok, value}` / `{:error, reason}` — preferred.
#     2. raise/rescue — for actually exceptional cases.
#   `with` chains tagged-tuple operations until one fails.
# ============================================================

defmodule Demo do
  def fetch(map, key) do
    case Map.fetch(map, key) do
      {:ok, value} -> {:ok, value}
      :error       -> {:error, "missing #{key}"}
    end
  end

  # `with` threads success cases; first failure short-circuits.
  def full_name(person) do
    with {:ok, first} <- fetch(person, :first),
         {:ok, last}  <- fetch(person, :last) do
      {:ok, "#{first} #{last}"}
    else
      {:error, reason} -> {:error, "name lookup failed: #{reason}"}
    end
  end
end

IO.inspect(Demo.full_name(%{first: "Alice", last: "Smith"}))
IO.inspect(Demo.full_name(%{first: "Alice"}))

# try/rescue for exceptions.
try do
  raise ArgumentError, "boom"
rescue
  e in ArgumentError -> IO.puts("caught: #{e.message}")
end


# ============================================================
# 17. Methods on types (dot-call)
#   LS: planned (Later). Elixir has NO dot-method-call — every "method"
#   is a module function: `String.upcase("hello")`, `Enum.map(list, fn)`.
#   The pipeline operator makes this read like dot-chains anyway.
# ============================================================

IO.inspect(String.upcase("hello"))
IO.inspect(String.replace("hello", "l", "L"))
IO.inspect(String.trim("  pad  "))
IO.inspect(Enum.join(["a", "b", "c"], ","))
IO.inspect(String.split("a,b,c", ","))
IO.inspect(Map.to_list(%{a: 1}))


# ============================================================
# 18. Inspect / debug
#   LS: planned (Future). Elixir: `IO.inspect/2` PRINTS and RETURNS its
#   argument, which makes it perfect for mid-pipeline tracing.
# ============================================================

x = [1, 2, 3]
IO.inspect(x)                   # [1, 2, 3]
IO.inspect(x, label: "the list") # the list: [1, 2, 3]

# Mid-pipeline trace — the killer use case.
[1, 2, 3]
|> IO.inspect(label: "input")
|> Enum.map(&(&1 * 2))
|> IO.inspect(label: "doubled")
|> Enum.sum()
|> IO.inspect(label: "sum")

# `dbg/0` (Elixir 1.14+) auto-shows the pipeline at each step.


# ============================================================
# 19. Beyond Lucky Script — Elixir gems
#   LS: not planned.
# ============================================================

# --- Processes & message passing: the BEAM concurrency model ---
# `spawn` starts a process; `send`/`receive` exchange messages. Processes
# are isolated — no shared memory, no locks. This is the *actor model*.

pid =
  spawn(fn ->
    receive do
      {:hello, from} -> send(from, {:reply, "hi back"})
    after
      1_000 -> :timeout
    end
  end)

send(pid, {:hello, self()})

receive do
  {:reply, msg} -> IO.puts("got: #{msg}")
after
  1_000 -> IO.puts("no reply")
end


# --- `with` deeper: not just for errors, but for sequential matching ---
# Each clause must match (with `<-`); failure jumps to `else`. Plain `=`
# inside `with` is a hard match (raises if it fails, like regular `=`).

defmodule WithDemo do
  def example(map) do
    with {:ok, name} <- Map.fetch(map, :name),
         "Alice"      <- name do
      "exactly Alice"
    else
      "Bob"             -> "found Bob"
      :error            -> "no name key"
      other when is_binary(other) -> "some other name: #{other}"
    end
  end
end

IO.inspect(WithDemo.example(%{name: "Alice"}))
IO.inspect(WithDemo.example(%{name: "Carol"}))


# --- Sigils: domain-specific literals ---
# A sigil is `~` + a character + delimiters. Built-ins include:
#   ~s, ~S — string (with/without escape)
#   ~r — regex
#   ~w — word list
#   ~D, ~T, ~U — date / time / utc-datetime
# You can define your own.

IO.inspect(~w[alpha beta gamma])             # ["alpha", "beta", "gamma"]
IO.inspect(Regex.match?(~r/\d+/, "abc123"))   # true
IO.inspect(~D[2026-01-01])


# --- Protocols: polymorphism via dispatch on the FIRST argument's type ---
# Like Haskell typeclasses or Rust traits, but for a dynamic runtime.
# A protocol declares functions; implementations are provided per type.

defprotocol Shoutable do
  def shout(thing)
end

defimpl Shoutable, for: BitString do
  def shout(s), do: String.upcase(s) <> "!"
end

defimpl Shoutable, for: List do
  def shout(items), do: Enum.map(items, &Shoutable.shout/1)
end

IO.inspect(Shoutable.shout("hello"))         # "HELLO!"
IO.inspect(Shoutable.shout(["hi", "yo"]))    # ["HI!", "YO!"]
