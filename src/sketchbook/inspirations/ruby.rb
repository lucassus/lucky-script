# ============================================================
# Lucky Script Inspirations — Ruby
# ============================================================
# Assumed: Ruby 3.3+
# See ../roadmap.md for Lucky Script's feature roadmap.
#
# Ruby is one of the closest design cousins of Lucky Script: `do/end`,
# postfix `if`, expression-orientation, method-chaining, and lambdas.
# Several LS roadmap items map almost 1:1 here.
#
# Sections:
#   01. Comments & program structure
#   02. Variables & assignment
#   03. Numbers, booleans, nil
#   04. Strings
#   05. Operators
#   06. if / elsif / else
#   07. while, break, next, postfix-if
#   08. for-each (Array#each)
#   09. Methods, blocks, default & keyword args
#   10. Lambdas & procs
#   11. Higher-order methods & chains (Ruby's "pipeline")
#   12. Arrays
#   13. Hashes
#   14. Sets
#   15. Pattern matching & destructuring
#   16. Error handling
#   17. Methods on types (dot-call)
#   18. Inspect / debug
#   19. Beyond LS: blocks/yield, metaprogramming, mixins, symbols
# ============================================================


# ============================================================
# 01. Comments & program structure
#   LS: shipped (# comments). LS has no modules; Ruby has `module`/`class`.
# ============================================================

# Single-line comments use #.
=begin
Block comments use =begin/=end, must start at column 0.
Rarely used in practice — most Rubyists stick to # lines.
=end

require "set"


# ============================================================
# 02. Variables & assignment
#   LS: shipped. Parallel multi-assignment planned (Later) —
#   Ruby has had it forever via tuple destructuring.
# ============================================================

x = 10
x = 20

x += 5
x *= 2

a, b = 1, 2
a, b = b, a              # idiomatic swap

first, *rest = [1, 2, 3, 4]   # first=1, rest=[2, 3, 4]

# Variable sigils encode scope: local (x), @instance, @@class, $global, CONST.


# ============================================================
# 03. Numbers, booleans, nil
#   LS: shipped. Ruby integers are arbitrary-precision; nil is the "nothing".
# ============================================================

n = 1_000_000
pi = 3.14159
big = 10 ** 100

t = true
f = false
nothing = nil

# Only `false` and `nil` are falsy. 0, "", [] are all truthy — opposite
# of Python. LS's roadmap goes with Python-style truthiness for strings.


# ============================================================
# 04. Strings
#   LS: shipped (escapes, concat). f-strings planned (Later);
#   multiline planned (Future). Ruby has interpolation natively.
# ============================================================

greeting = "hello"
name = "world"
puts greeting + " " + name

puts "say \"hi\""
puts "line1\nline2"
puts 'single-quoted: no \n escape interpretation'

# String interpolation — "#{expr}" inside double-quoted strings only.
puts "hello #{name}"
puts "sum is #{1 + 2}"

# Heredocs for multi-line content. <<~ strips common leading whitespace.
multi = <<~TEXT
  line 1
  line 2
TEXT


# ============================================================
# 05. Operators
#   LS: shipped (+/-*//**, comparison, boolean). Modulo `%` planned (Later).
# ============================================================

puts(1 + 2 * 3 ** 2)
puts(10 % 3)
puts(10 / 3)             # integer division when both operands are Integer
puts(10.0 / 3)           # float division when either is Float

puts(1 < 2 && 2 <= 3)    # no chained comparisons in Ruby — use &&

puts(true && false)
puts(true || false)
puts(!true)

# `and`/`or`/`not` exist but have very low precedence — &&/||/! preferred.


# ============================================================
# 06. if / elsif / else
#   LS: shipped (statement). if-expression planned (Next) —
#   in Ruby everything is an expression already.
# ============================================================

def classify(value)
  if value < 0
    -1
  elsif value.zero?
    0
  else
    1
  end
end

# if-as-expression: assign the result of an if directly.
abs_value = if x < 0 then -x else x end

# Ternary form.
abs_value = x < 0 ? -x : x

# `unless` is sugar for `if not` — Ruby ships it; LS deliberately won't.
puts "ok" unless x.nil?


# ============================================================
# 07. while, break, next, postfix-if
#   LS: shipped (while/break/continue). Guard-if planned (Later) —
#   Ruby's postfix `if`/`unless` is the design reference.
# ============================================================

i = 0
while i < 10
  i += 1
  next if i == 3       # `next` is Ruby's `continue`
  break if i == 7
  puts i
end

# Postfix `if`/`unless` work on any statement in Ruby (LS deliberately
# restricts guard-if to return/break/continue — see roadmap "Decisions").
puts "negative" if x < 0
puts "nonzero" unless x.zero?

# `loop do ... end` for unconditional looping; break with a value.
result = loop do
  break 42
end


# ============================================================
# 08. for-each (Array#each)
#   LS: planned (Next). Idiomatic Ruby never uses `for`; `each` is king.
# ============================================================

total = 0
[10, 20, 30].each { |item| total += item }

# with_index threads the index alongside the value.
%w[a b c].each_with_index { |item, i| puts "#{i}: #{item}" }

# zip walks multiple collections in lockstep.
[1, 2, 3].zip(%w[x y z]).each { |a, b| puts "#{a}/#{b}" }


# ============================================================
# 09. Methods, blocks, default & keyword args
#   LS: shipped (functions, closures). Defaults & kwargs planned (Later) —
#   Ruby is the design reference for keyword args.
# ============================================================

def add(a, b)
  a + b
end

# Default arguments. Evaluated at call time, like LS's plan.
def greet(person, greeting: "Hello")
  puts "#{greeting}, #{person}"
end

greet("Alice")
greet("Alice", greeting: "Hi")     # keyword argument

# `*args` splats positional, `**kwargs` splats keyword. `&blk` captures a block.
def variadic(*args, **kwargs, &blk)
  puts args.inspect
  puts kwargs.inspect
  blk&.call
end

variadic(1, 2, 3, name: "Alice") { puts "block ran" }

# Closures: blocks and lambdas close over enclosing locals.
def make_counter
  count = 0
  -> { count += 1 }
end

counter = make_counter
puts counter.call       # 1
puts counter.call       # 2


# ============================================================
# 10. Lambdas & procs
#   LS: shipped (full-form `fun(x) x*2`). Arrow shorthand `x -> x*2`
#   planned (Next) — Ruby's `->(x) { x * 2 }` is the closest match.
# ============================================================

double = ->(x) { x * 2 }
add_xy = ->(x, y) { x + y }
const = -> { 42 }

puts double.(3)          # call with .()
puts double.call(3)      # or .call
puts double[3]           # or []

# `proc {}` and `lambda {}` create slightly different beasts; lambdas
# enforce arity, procs don't. The `->` arrow is the modern lambda.


# ============================================================
# 11. Higher-order methods & chains (Ruby's "pipeline")
#   LS: HOFs work today via lambdas. Pipeline `|>` planned (Next) —
#   Ruby has no `|>`; method chaining via `.` plays the same role.
# ============================================================

nums = [1, 2, 3, 4, 5]

doubled = nums.map { |v| v * 2 }
positives = nums.select { |v| v > 2 }
total = nums.reduce(0) { |acc, v| acc + v }

# The "Ruby pipeline" is just chaining methods on collections.
result = nums
  .select { |v| v > 0 }
  .map    { |v| v * 2 }
  .sum
puts result


# ============================================================
# 12. Arrays
#   LS: planned (Next). Ruby Array is dynamic, indexable, mixed-type.
# ============================================================

nums = [1, 2, 3, 4, 5]
puts nums[0]
puts nums[-1]            # negative indexing
puts nums[1..3].inspect  # range slicing (inclusive)
puts nums[1...3].inspect # range slicing (exclusive)
nums << 6
nums[0] = 100
puts nums.length

# %w[] / %i[] shorthand for arrays of words / symbols.
words = %w[alpha beta gamma]
syms  = %i[get post put]


# ============================================================
# 13. Hashes
#   LS: planned (Next). Ruby hashes preserve insertion order.
# ============================================================

person = { "name" => "Alice", "age" => 30 }
puts person["name"]

# Symbol-keyed hash with shorthand syntax.
person = { name: "Alice", age: 30 }     # equivalent to { :name => "Alice" }
puts person[:name]
person[:role] = "admin"
puts person.fetch(:missing, "default")
person.delete(:role)

# Bare identifiers in `{ name: ... }` desugar to symbol keys — note that
# LS's roadmap chooses *string* keys for the same syntax. Different
# design choice for similar-looking literals.


# ============================================================
# 14. Sets
#   LS: planned (Later). Ruby Set requires `require "set"`;
#   no literal syntax — design lesson for LS.
# ============================================================

primes = Set[2, 3, 5, 7]
primes << 11
puts primes.include?(2)
empty = Set.new

# Operations.
puts (Set[1, 2, 3] | Set[3, 4]).inspect    # union
puts (Set[1, 2, 3] & Set[2, 3, 4]).inspect # intersection
puts (Set[1, 2, 3] - Set[2]).inspect       # difference


# ============================================================
# 15. Pattern matching & destructuring
#   LS: planned (Next). Ruby 3.0+ has case/in pattern matching.
# ============================================================

def describe(value)
  case value
  in 0
    "zero"
  in Integer => n if n < 0
    "negative"
  in []
    "empty"
  in [x]
    "one: #{x}"
  in [x, *tail]
    "first #{x}, then #{tail.length} more"
  in { name: String => person_name }
    "named #{person_name}"
  else
    "other"
  end
end

# Destructuring in assignment — array shapes only.
a, b, c = [1, 2, 3]
head, *tail = [1, 2, 3, 4]

# Hash destructuring requires pattern-matching syntax (`case/in`) or
# explicit `.fetch` / `.values_at`. LS plans a direct `{name, age} = h`.


# ============================================================
# 16. Error handling
#   LS: planned (Later) — try/catch. Ruby: begin/rescue/else/ensure.
# ============================================================

begin
  result = nums.fetch(99)
rescue IndexError => e
  puts "Error: #{e.message}"
rescue TypeError, ArgumentError
  puts "Bad input"
else
  puts "no error path"
ensure
  puts "always runs"
end

# Method-body shorthand: implicit `begin` around the body.
def safe_first(arr)
  arr.first or raise "empty array"
rescue => e
  puts "caught: #{e.message}"
  nil
end

class AppError < StandardError; end


# ============================================================
# 17. Methods on types (dot-call)
#   LS: planned (Later). Ruby's design IS dot-method calls — every value
#   is an object with methods. No special syntax distinguishes "builtins".
# ============================================================

puts "hello".upcase
puts "hello".gsub("l", "L")
puts "  pad  ".strip
puts ["a", "b", "c"].join(",")
puts "a,b,c".split(",").inspect
puts [1, 2, 3].count(1)
puts({ a: 1 }.to_a.inspect)


# ============================================================
# 18. Inspect / debug
#   LS: planned (Future). Ruby: every object has `.inspect` and `.to_s`.
# ============================================================

x = [1, 2, 3]
puts x.inspect           # '[1, 2, 3]'
p x                      # equivalent to puts x.inspect
pp x                     # pretty-print for nested structures
puts x.class             # 'Array'

# `binding.irb` / `binding.pry` drop into a REPL at runtime.


# ============================================================
# 19. Beyond Lucky Script — Ruby gems
#   LS: not planned.
# ============================================================

# --- Blocks & yield: Ruby's signature idea ---
# Every method can implicitly receive a block. The body uses `yield`
# to invoke it. Two block syntaxes: { ... } (one-liner) and do ... end.
def each_squared(arr)
  arr.each { |v| yield v * v }
end

each_squared([1, 2, 3]) { |sq| puts sq }

# Blocks aren't first-class values — but `&blk` captures one as a Proc.
def with_logging(&blk)
  puts "before"
  blk.call
  puts "after"
end


# --- Metaprogramming: defining methods at runtime ---
class Greeter
  %i[hello hi hey].each do |name|
    define_method(name) do |target|
      "#{name.to_s.capitalize}, #{target}!"
    end
  end
end

puts Greeter.new.hello("Alice")    # "Hello, Alice!"
puts Greeter.new.hey("Bob")        # "Hey, Bob!"

# `method_missing` intercepts unknown method calls.
class Stub
  def method_missing(name, *args)
    "you called #{name} with #{args.inspect}"
  end

  def respond_to_missing?(_name, _private = false)
    true
  end
end

puts Stub.new.whatever(1, 2)


# --- Mixins: composable behavior via modules ---
module Greetable
  def greet
    "Hello, #{name}!"
  end
end

class Person
  include Greetable
  attr_reader :name

  def initialize(name)
    @name = name
  end
end

puts Person.new("Alice").greet


# --- Symbols: interned, immutable identifiers ---
# Symbols are atoms — useful as hash keys, method names, state tags.
status = :active
puts status.inspect       # ':active'
puts status == :active    # true
puts :foo.object_id == :foo.object_id   # symbols are interned: same id


# --- Bonus: Range, &:method shorthand, frozen literals ---
(1..5).each { |v| puts v }              # inclusive range
puts [1, 2, 3].map(&:to_s).inspect      # &:method is sugar for { |x| x.to_s }
NAMES = %w[alice bob].freeze            # frozen literals are common idiom
