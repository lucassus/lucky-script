# ============================================================
# Lucky Script Inspirations — Python
# ============================================================
# Assumed: Python 3.12+
# See ../roadmap.md for Lucky Script's feature roadmap.
#
# Sections:
#   01. Comments & program structure
#   02. Variables & assignment
#   03. Numbers, booleans, None
#   04. Strings
#   05. Operators
#   06. if / elif / else
#   07. while, break, continue, guard-style early exit
#   08. for-each
#   09. Functions, closures, default & keyword args
#   10. Lambdas
#   11. Higher-order functions & pipelines
#   12. Lists
#   13. Dicts
#   14. Sets
#   15. Pattern matching & destructuring
#   16. Error handling
#   17. Methods on types (dot-call)
#   18. Inspect / debug
#   19. Beyond LS: decorators, generators, with, comprehensions
# ============================================================


# ============================================================
# 01. Comments & program structure
#   LS: shipped (# comments). LS has no modules.
# ============================================================

# Single-line comments use #.
# Python has no native block-comment syntax — triple-quoted strings at
# module scope serve as docstrings or as ignored expressions:
"""Module-level docstring (Python's stand-in for block comments)."""

# Imports group at the top of a file. Top-level statements run in order.
import math
from collections import Counter
from contextlib import contextmanager
from dataclasses import dataclass
from functools import reduce


# ============================================================
# 02. Variables & assignment
#   LS: shipped. Parallel multi-assignment planned (Later) —
#   Python has had it forever via tuple unpacking.
# ============================================================

# No declaration keyword. First assignment binds; later assignment rebinds.
x = 10
x = 20

# Compound assignment.
x += 5
x *= 2

# Parallel multi-assignment: RHS fully evaluated before any binding.
a, b = 1, 2
a, b = b, a   # idiomatic swap

# Star-unpack captures "the rest".
first, *rest = [1, 2, 3, 4]   # first=1, rest=[2, 3, 4]


# ============================================================
# 03. Numbers, booleans, None
#   LS: shipped. Python: int is arbitrary-precision; float is IEEE 754.
# ============================================================

n = 1_000_000        # underscores for readability
pi = 3.14159
big = 10 ** 100      # arbitrary-precision integer

t = True
f = False
nothing = None       # Python's "nothing"


# ============================================================
# 04. Strings
#   LS: shipped (escapes, concat). f-strings planned (Later);
#   multiline planned (Future). Python has both natively.
# ============================================================

greeting = "hello"
name = "world"
print(greeting + " " + name)

# Escapes.
print("say \"hi\"")
print("line1\nline2")
print(r"raw: \n is literal")     # raw strings — no escape interpretation

# f-string interpolation. Any expression goes inside {}.
print(f"hello {name}")
print(f"sum is {1 + 2}")
print(f"{name=}")                # debug form (3.8+): prints 'name='world''

# Multi-line strings.
multi = """
  line 1
  line 2
"""


# ============================================================
# 05. Operators
#   LS: shipped (+/-*//**, comparison, boolean). Modulo `%` planned (Later).
# ============================================================

print(1 + 2 * 3 ** 2)    # exponentiation; same precedence story as LS
print(10 % 3)             # modulo
print(10 // 3)            # floor division (Python-specific)
print(10 / 3)             # true division (always float)

# Chained comparisons (Python-specific sugar).
print(1 < 2 <= 3)

# Boolean operators.
print(True and False)
print(True or False)
print(not True)

# Truthiness: empty containers, 0, "", None are falsy.
xs: list[int] = []
if not xs:
    print("empty")


# ============================================================
# 06. if / elif / else
#   LS: shipped (statement). if-expression planned (Next) —
#   Python has had `x if cond else y` since forever.
# ============================================================

def classify(value: int) -> int:
    if value < 0:
        return -1
    elif value == 0:
        return 0
    else:
        return 1


# if-expression (Python's ternary).
abs_value = -x if x < 0 else x


# ============================================================
# 07. while, break, continue, guard-style early exit
#   LS: shipped (while/break/continue). Guard-if planned (Later) —
#   Python has no postfix `if`; explicit `if + return/continue` is idiomatic.
# ============================================================

i = 0
while i < 10:
    i += 1
    if i == 3:
        continue
    if i == 7:
        break
    print(i)


# Python idiom for guarded early exit: explicit `if` then return/continue.
def first_positive(nums: list[int]) -> int | None:
    for v in nums:
        if v > 0:
            return v
    return None


# ============================================================
# 08. for-each iteration
#   LS: planned (Next). Python's `for` is a for-each by design.
# ============================================================

total = 0
for item in [10, 20, 30]:
    total += item

# `range` generates a lazy integer sequence.
for i in range(5):
    print(i)

# `enumerate` pairs index with value — the clean idiom for indexed loops.
for i, item in enumerate(["a", "b", "c"]):
    print(i, item)

# `zip` walks multiple iterables in lockstep.
for a, b in zip([1, 2, 3], ["x", "y", "z"]):
    print(a, b)


# ============================================================
# 09. Functions, closures, default & keyword args
#   LS: shipped (functions, closures). Defaults & kwargs planned (Later).
# ============================================================

def add(a: int, b: int) -> int:
    return a + b


def greet(person: str, greeting: str = "Hello") -> None:
    print(f"{greeting}, {person}")


greet("Alice")
greet("Alice", greeting="Hi")            # keyword argument


# *args / **kwargs collect variadic positional and keyword arguments.
def variadic(*args: int, **kwargs: str) -> None:
    print(args, kwargs)


variadic(1, 2, 3, name="Alice")


# Closures: inner function captures enclosing variables.
# `nonlocal` is required to *rebind* an enclosing variable.
def make_counter():
    count = 0

    def inc() -> int:
        nonlocal count
        count += 1
        return count

    return inc


counter = make_counter()
print(counter(), counter())     # 1 2


# ============================================================
# 10. Lambdas
#   LS: shipped (full-form `fun(x) x*2`). Arrow shorthand
#   `x -> x*2` planned (Next). Python lambdas are expression-only.
# ============================================================

double = lambda x: x * 2
add_xy = lambda x, y: x + y
const = lambda: 42

# Pythonic style prefers `def` over `lambda` for non-trivial bodies.


# ============================================================
# 11. Higher-order functions & pipelines
#   LS: HOFs work today via lambdas. Pipeline `|>` planned (Next).
#   Python has no `|>` — comprehensions or chained calls stand in.
# ============================================================

nums = [1, 2, 3, 4, 5]

doubled = list(map(lambda v: v * 2, nums))
positives = list(filter(lambda v: v > 2, nums))
total = reduce(lambda acc, v: acc + v, nums, 0)

# Pythonic alternative: a comprehension.
total = sum(v * 2 for v in nums if v > 2)


# ============================================================
# 12. Lists
#   LS: planned (Next). Python's list is dynamic, indexable, mutable.
# ============================================================

nums = [1, 2, 3, 4, 5]
print(nums[0], nums[-1])         # negative indexing
print(nums[1:4])                  # slicing
nums.append(6)
nums[0] = 100
print(len(nums))


# ============================================================
# 13. Dicts
#   LS: planned (Next). Python dicts preserve insertion order (3.7+).
# ============================================================

person = {"name": "Alice", "age": 30}
print(person["name"])
person["role"] = "admin"
print(person.get("missing", "default"))
del person["role"]

# Dict literals can use any hashable as key. Bare identifiers are NOT
# treated as string keys — `{name: 1}` looks up the variable `name`.
# LS's roadmap chose the opposite for ergonomic dict-as-record use.


# ============================================================
# 14. Sets
#   LS: planned (Later). Python set literals collide with dict syntax —
#   `{}` is an empty dict, `set()` is an empty set. Same problem LS will face.
# ============================================================

primes = {2, 3, 5, 7}
primes.add(11)
print(2 in primes)
empty = set()

# Set operations.
print({1, 2, 3} | {3, 4})       # union
print({1, 2, 3} & {2, 3, 4})    # intersection
print({1, 2, 3} - {2})          # difference


# ============================================================
# 15. Pattern matching & destructuring
#   LS: planned (Next). Python 3.10+ has structural pattern matching.
# ============================================================

def describe(value):
    match value:
        case 0:
            return "zero"
        case n if n < 0:
            return "negative"
        case []:
            return "empty"
        case [x]:
            return f"one: {x}"
        case [x, *tail]:
            return f"first {x}, then {len(tail)} more"
        case {"name": person_name}:
            return f"named {person_name}"
        case _:
            return "other"


# Destructuring in assignment (list/tuple shapes).
a, b, c = [1, 2, 3]
head, *tail = [1, 2, 3, 4]

# Dict-shaped destructuring uses `match` — there's no syntactic form for it
# in plain assignment, unlike LS's planned `{name, age} = person`.


# ============================================================
# 16. Error handling
#   LS: planned (Later) — try/catch. Python: try/except/else/finally.
# ============================================================

try:
    result = nums[99]
except IndexError as e:
    print(f"Error: {e}")
except (TypeError, ValueError):
    print("Bad input")
else:
    print("no error path")       # runs only if no exception
finally:
    print("always runs")


# Custom exception classes derive from Exception.
class AppError(Exception):
    pass


def must_be_positive(value: int) -> int:
    if value < 0:
        raise AppError(f"negative: {value}")
    return value


# ============================================================
# 17. Methods on types (dot-call)
#   LS: planned (Later). Python types ship rich method surfaces.
# ============================================================

print("hello".upper())
print("hello".replace("l", "L"))
print("  pad  ".strip())
print(",".join(["a", "b", "c"]))
print("a,b,c".split(","))
print([1, 2, 3].count(1))
print({"a": 1}.items())


# ============================================================
# 18. Inspect / debug
#   LS: planned (Future). Python: repr() vs str(); f"{x=}" for print-debug.
# ============================================================

x = [1, 2, 3]
print(repr(x))                  # '[1, 2, 3]'  — eval-able representation
print(f"{x=}")                  # 'x=[1, 2, 3]'  (3.8+ debug form)
print(type(x).__name__)         # 'list'

# `dir(obj)` lists the attribute surface; `help(obj)` prints docs.
# `breakpoint()` drops into the debugger at runtime.


# ============================================================
# 19. Beyond Lucky Script — Python gems
#   LS: not planned.
# ============================================================

# --- Decorators: functions that wrap other functions ---
def log_calls(fn):
    def wrapped(*args, **kwargs):
        print(f"call {fn.__name__}({args}, {kwargs})")
        return fn(*args, **kwargs)
    return wrapped


@log_calls
def cube(value: int) -> int:
    return value ** 3


cube(3)


# Decorators with arguments are factories returning a decorator.
def retry(times: int):
    def decorator(fn):
        def wrapped(*args, **kwargs):
            for _ in range(times):
                try:
                    return fn(*args, **kwargs)
                except Exception:  # noqa: BLE001
                    continue
            raise RuntimeError("retries exhausted")
        return wrapped
    return decorator


# --- Generators: lazy iterators via `yield` ---
def fib_gen():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b


import itertools
print(list(itertools.islice(fib_gen(), 10)))


# Generator expressions: comprehension syntax with parens, lazy.
squares_iter = (v * v for v in range(1_000_000))


# --- Context managers: `with` statements for scoped resource handling ---
@contextmanager
def section(name: str):
    print(f"--- enter {name} ---")
    try:
        yield
    finally:
        print(f"--- exit  {name} ---")


with section("demo"):
    print("inside")


# --- Comprehensions: list / dict / set / generator ---
squares = [v * v for v in range(10)]
even_squares = [v * v for v in range(10) if v % 2 == 0]
name_to_len = {nm: len(nm) for nm in ["Alice", "Bob"]}
unique_lens = {len(nm) for nm in ["Alice", "Bob", "Eve"]}
lazy_gen = (v * v for v in range(10))


# --- Dataclasses: structural records without boilerplate ---
@dataclass(frozen=True)
class Point:
    x: float
    y: float


p = Point(1.0, 2.0)
print(p)                # Point(x=1.0, y=2.0)


# --- Counter, namedtuple, Enum, and other batteries ---
print(Counter("mississippi"))
print(math.gcd(12, 18))
