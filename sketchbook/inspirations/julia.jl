# ============================================================
# Lucky Script Inspirations — Julia
# ============================================================
# Assumed: Julia 1.10+
# See ../roadmap.md for Lucky Script's feature roadmap.
#
# Julia is expression-oriented, dynamically typed by default, and built
# around multiple dispatch: the same function name selects implementations
# based on the run-time types of *all* arguments (not just the receiver).
# Other LS-relevant ideas: broadcasting (`.`), the pipe `|>`, kwargs &
# defaults everywhere, `nothing` as an explicit absence value, and a rich
# meta-programming layer (`@`-macros).
#
# Sections:
#   01. Comments & program structure
#   02. Variables & assignment
#   03. Numbers, booleans, nothing / missing
#   04. Strings
#   05. Operators & broadcasting
#   06. if / elseif / else (expression form via `if ... end` value)
#   07. while, break, continue
#   08. for-each
#   09. Functions, closures, defaults & keyword args
#   10. Anonymous functions (Lambdas)
#   11. Higher-order functions & the pipe `|>`
#   12. Arrays & tuples (1-based indexing)
#   13. Dicts
#   14. Sets
#   15. Pattern-related constructs (destructuring, no built-in `match`)
#   16. Error handling: try / catch / finally, throw
#   17. Methods on types (structs + multiple dispatch)
#   18. Inspect / debug (@show, repr, typeof)
#   19. Beyond LS: multiple dispatch tour, macros, generated functions
# ============================================================


# ============================================================
# 01. Comments & program structure
#   LS: shipped (# comments). Julia: `#` line; `#=` block `#= nested =#`.
#       Files can `include` others; `module`/`baremodule` define namespaces.
# ============================================================

# Single-line comments use `#`.

#= Block comments nest cleanly:
   #= inner =#
=#

# Typical script layout: `using` / `import`, then definitions, then `main`.


# ============================================================
# 02. Variables & assignment
#   LS: shipped. Julia: first assignment binds (global in the REPL/script);
#       inside functions, locals are inferred unless declared `global`/`local`.
#       Parallel assignment via tuples — same spirit as Python.
# ============================================================

function section02()
    x = 10
    x = 20
    x += 5
    x *= 2

    a, b = 1, 2
    a, b = b, a  # swap

    tup = (1, 2, 3, 4)
    first = tup[1]
    rest = tup[2:end]  # tuple slice — rest is still a Tuple
    return (x, first, length(rest))
end


# ============================================================
# 03. Numbers, booleans, nothing / missing
#   LS: shipped. Julia: distinct numeric types (Int64, Float64, BigInt…).
#       `nothing` is a singleton — the idiomatic “no value” for generic code.
#       `missing` (from Missing.jl semantics in Base) marks sentinel absence in data.
# ============================================================

function section03()
    n = 1_000_000           # underscores allowed
    huge = big(10)^100       # BigInt (`big()` constructor — avoid naming locals `big`)

    t = true
    f = false

    maybe_name::Union{Nothing,String} = "Alice"
    len = isnothing(maybe_name) ? 0 : length(maybe_name)

    # Three-valued logic: missing propagates through many ops.
    xs = [1, missing, 3]
    return (n, huge, t ⊻ f, len, sum(skipmissing(xs)))
end


# ============================================================
# 04. Strings
#   LS: shipped (escapes, concat). Julia: `"..."`, `$var` / `$(expr)`
#       interpolation; triple quotes for multiline; raw strings via raw"...",
#       though `"\\n"` style escapes are standard.
# ============================================================

function section04()
    greeting = "hello"
    name = "world"
    println(greeting * " " * name)

    println("say \"hi\"")
    println("line1\nline2")

    msg = "hello $name, you are $(30 + 0)"
    println(msg)

    multi = """
      line 1
      line 2
    """

    return length(multi)
end


# ============================================================
# 05. Operators & broadcasting
#   LS: shipped (+/-*//**, comparisons, boolean). Julia uses `^` for powers;
#       chained comparisons work like Python (`1 < 2 ≤ 3` with Unicode or `<=`).
#       Broadcasting: `f.(xs)` applies `f` elementwise — central to Julia style.
# ============================================================

function section05()
    println(1 + 2 * 3^2)
    println(10 % 3)
    println(10 ÷ 3)    # floor division (typed as `\div`)
    println(10 / 3)    # always floating promotion where needed

    println(1 < 2 <= 3)

    println(true && false)
    println(true || false)
    println(!true)

    xs = Int[]
    isempty(xs) && println("empty")

    # Broadcasting — multiply each element by 2.
    ys = [1, 2, 3, 4]
    zs = ys .* 2
    return zs
end


# ============================================================
# 06. if / elseif / else
#   LS: shipped (statement). In Julia, `if ... end` is an expression and yields
#       a value when used as one (all branches should type-compat).
# ============================================================

function classify(value::Int)::Int
    if value < 0
        return -1
    elseif value == 0
        return 0
    else
        return 1
    end
end

function abs_value(x::Int)::Int
    x < 0 ? -x : x  # ternary — another expression form
end


# ============================================================
# 07. while, break, continue
#   LS: shipped (while/break/continue). Julia matches this closely.
# ============================================================

function section07()
    i = 0
    while i < 10
        i += 1
        i == 3 && continue
        i == 7 && break
        println(i)
    end
    return nothing
end


# ============================================================
# 08. for-each
#   LS: planned (Next). Julia has no C-style `for(;;)` — `for` iterates
#       containers/ranges. `enumerate`, `pairs`, and `zip` are standard.
# ============================================================

function section08()
    total = 0
    for item in (10, 20, 30)
        total += item
    end

    for j in 0:4  # inclusive endpoints with integers: `0:4` is 0..4
        println(j)
    end

    for (idx, ch) in enumerate(['a', 'b', 'c'])
        println(idx, ": ", ch)
    end

    for (a, b) in zip([1, 2, 3], ["x", "y", "z"])
        println(a, " ", b)
    end

    return total
end


# ============================================================
# 09. Functions, closures, default & keyword args
#   LS: shipped (functions, closures). Defaults & kwargs planned (Later) —
#       Julia has keyword args from day one; `@kwdef` structs pair nicely.
# ============================================================

function add(a::Int, b::Int)::Int
    a + b
end

function greet(person::String; greeting::String="Hello")
    println("$greeting, $person")
end

function variadic(args::Int...; kwargs...)
    println(collect(args), " ", Dict(kwargs))
end

function make_counter()
    count = Ref(0)  # mutable box — closures capture bindings
    return function ()
        count[] += 1
        return count[]
    end
end

function section09()
    greet("Alice")
    greet("Alice"; greeting="Hi")
    variadic(1, 2, 3; name="Alice")
    c = make_counter()
    return (c(), c())
end


# ============================================================
# 10. Lambdas
#   LS: shipped (full-form). Julia anonymous functions: `x -> x * 2`
#       or `(x, y) -> x + y`.
# ============================================================

function section10()
    double = x -> x * 2
    add_xy = (x, y) -> x + y
    const_fn = () -> 42
    return (double(21), add_xy(40, 2), const_fn())
end


# ============================================================
# 11. Higher-order functions & the pipe `|>`
#   LS: HOFs work today. Pipeline `|>` planned (Next) — Julia has `|>` built in.
# ============================================================

function section11()
    nums = [1, 2, 3, 4, 5]

    doubled = map(x -> x * 2, nums)
    positives = filter(x -> x > 2, nums)
    total = reduce(+, nums; init=0)

    chained =
        nums |>
        xs -> filter(x -> x > 0, xs) |>
        xs -> map(x -> x * 2, xs) |>
        xs -> sum(xs)

    alt = sum(v * 2 for v in nums if v > 2)

    return (doubled, positives, total, chained, alt)
end


# ============================================================
# 12. Arrays & tuples (1-based indexing)
#   LS: planned (Next). Julia arrays are column-major and **1-indexed** —
#       `xs[1]` is the first element. This is the biggest ergonomics delta vs LS/Python.
# ============================================================

function section12()
    nums = [1, 2, 3, 4, 5]
    println(nums[1], " ", nums[end])   # `end` inside indexing is last index
    println(nums[2:4])

    push!(nums, 6)
    nums[1] = 100
    println(length(nums))

    # Named tuples — lightweight records without defining a struct.
    pt = (x=1.0, y=2.0)
    return (nums, pt.x + pt.y)
end


# ============================================================
# 13. Dicts
#   LS: planned (Next). Julia `Dict` is hash-based; keys need `hash`/`isequal`.
#       `Symbol` keys (`:name`) are idiomatic for records-as-maps.
# ============================================================

function section13()
    person = Dict("name" => "Alice", "age" => "30")
    println(person["name"])
    person["role"] = "admin"
    println(get(person, "missing", "default"))
    delete!(person, "role")
    println(length(person))
    return person
end


# ============================================================
# 14. Sets
#   LS: planned (Later). Julia `Set` constructor — no ambiguity with dict `{}`.
# ============================================================

function section14()
    primes = Set([2, 3, 5, 7])
    push!(primes, 11)
    println(2 ∈ primes)
    empty_set = Set{Int}()
    return (length(primes), length(empty_set), union(Set([1, 2]), Set([2, 3])))
end


# ============================================================
# 15. Pattern-related constructs
#   LS: planned (Next). Julia has no Haskell/Rust-style `match`; patterns appear
#       as destructuring in assignments, `catch e`, and dispatch on types.
# ============================================================

function describe(value)
    # Put structural checks before numeric comparisons — Dicts don't `<` Ints.
    if value isa Dict && haskey(value, :name)
        "named $(value[:name])"
    elseif value isa Vector && isempty(value)
        "empty"
    elseif value isa Vector && length(value) == 1
        "one: $(value[1])"
    elseif value isa Vector
        "first $(value[1]), then $(length(value)-1) more"
    elseif value == 0
        "zero"
    elseif value isa Real && value < 0
        "negative"
    else
        "other"
    end
end

function section15()
    a, b, c = 1, 2, 3
    arr = [1, 2, 3, 4]
    head = arr[1]
    tail = arr[2:end]
    return (a + b + c, head, length(tail))
end


# ============================================================
# 16. Error handling
#   LS: planned (Later) — try/catch. Julia: try / catch / else / finally;
#       `error(msg)` throws `ErrorException`; libraries define richer types.
# ============================================================

function section16()
    nums = [1, 2, 3]
    try
        x = nums[99]
        println(x)
    catch e
        if e isa BoundsError
            println("bounds: ", e)
        else
            rethrow()
        end
    finally
        println("always runs")
    end
    return nothing
end

struct AppError <: Exception
    msg::String
end

Base.showerror(io::IO, e::AppError) = print(io, "AppError: ", e.msg)

function must_be_positive(value::Int)::Int
    value < 0 && throw(AppError("negative: $value"))
    value
end


# ============================================================
# 17. Methods on types (structs + multiple dispatch)
#   LS: planned (Later). Julia structs are nominal types; **methods are free
#       functions** selected by all arguments — `distance(p, q)`, not `p.distance(q)`.
# ============================================================

struct Point
    x::Float64
    y::Float64
end

# Single-method “constructor-like” behavior via inner constructors is possible;
# here we keep it minimal.

distance(a::Point, b::Point)::Float64 =
    sqrt((a.x - b.x)^2 + (a.y - b.y)^2)

translate(p::Point, dx::Float64, dy::Float64)::Point =
    Point(p.x + dx, p.y + dy)  # immutable struct → returns a new Point

function section17()
    p = Point(0.0, 0.0)
    q = Point(3.0, 4.0)
    println(distance(p, q))
    r = translate(p, 1.0, 1.0)
    println(r.x, ", ", r.y)

    println(uppercase("hello"))
    println(split("a,b,c", ','))
    println(sum([1, 2, 3]))
    return nothing
end


# ============================================================
# 18. Inspect / debug
#   LS: planned (Future). Julia: `println`, `repr`, `typeof`, `@show` (prints
#       name=value), `@debug` / logging ecosystem for richer traces.
# ============================================================

function section18()
    x = [1, 2, 3]
    println(repr(x))      # eval-ish-ish text form
    @show x               # prints `x = …`
    println(typeof(x))
    return nothing
end


# ============================================================
# 19. Beyond Lucky Script — Julia gems
#   LS: not planned (verbatim).
# ============================================================

# --- Multiple dispatch in action: same name, different (combinations of) types ---

abstract type Shape end

struct Circle <: Shape
    radius::Float64
end

struct Rect <: Shape
    w::Float64
    h::Float64
end

area(s::Circle)::Float64 = π * s.radius^2
area(s::Rect)::Float64 = s.w * s.h

describe_shape(s::Shape) = "shape with area $(area(s))"

# --- Parametric types & where-clauses ---

struct Box{T}
    value::T
end

unwrap(b::Box) = b.value

# --- Macros: code that generates code (`@assert`, `@time`, user-defined) ---

macro say_hi(ex...)
    name = length(ex) >= 1 ? ex[1] : nothing
    if name === nothing
        :(println("hi"))
    else
        :(println("hi, ", $(esc(name))))
    end
end

function macros_demo()
    @say_hi()
    @say_hi "Alice"
    return nothing
end

# --- Generated functions: staged computation tied to argument types ---

@generated function tuple_param_count(::Type{T}) where {T <: Tuple}
    return length(T.parameters)
end

function generated_demo()
    # Count type parameters of a heterogeneous tuple — done at compile time.
    return tuple_param_count(Tuple{Int,Int,String})
end


# ============================================================
# main — minimal driver so the file is a runnable script.
# ============================================================

function main()
    println("Lucky Script Inspirations — Julia")
    println(section02())
    println(section03())
    println(section04())
    println(section05())
    section07()
    println(section08())
    println(section09())
    println(section10())
    println(section11())
    println(section12())
    println(section13())
    println(section14())
    println(section15())
    println(describe(Dict(:name => "Ada")))
    section16()
    println(classify(5), " ", abs_value(-7))
    println(must_be_positive(3))
    section17()
    section18()
    println(area(Circle(2.0)))
    println(describe_shape(Rect(3.0, 4.0)))
    println(unwrap(Box(42)))
    macros_demo()
    println(generated_demo())
    return nothing
end

if abspath(PROGRAM_FILE) == @__FILE__
    main()
end
