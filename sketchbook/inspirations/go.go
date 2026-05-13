// ============================================================
// Lucky Script Inspirations — Go
// ============================================================
// Assumed: Go 1.22+.
// See ../roadmap.md for Lucky Script's feature roadmap.
//
// Go is the most idiomatically different from LS in this set: no
// exceptions (error-as-value), no `while` (`for` does everything),
// no pattern matching (type-switch is the closest), no classes
// (structs + interfaces + embedding). The interesting design lessons
// for LS are: multiple return values, defer, and structural interfaces.
//
// This file uses `package main` and `func main()` so it parses with
// `go vet`. Unused-var/import errors are silenced where needed via
// `_ = x` so each section reads as a standalone snippet.
//
// Sections:
//   01. Comments & program structure
//   02. Variables & assignment
//   03. Numbers, booleans, nil
//   04. Strings
//   05. Operators
//   06. if / else if / else
//   07. for / break / continue (Go has no while!)
//   08. for-each (range)
//   09. Functions, multiple returns, variadic
//   10. Function literals (no shorthand)
//   11. Higher-order functions & "pipelines"
//   12. Slices & arrays
//   13. Maps
//   14. Sets (map[T]struct{} idiom)
//   15. "Pattern matching" via type switch
//   16. Error handling (error-as-value, not exceptions)
//   17. Methods on types (dot-call on receivers)
//   18. Inspect / debug
//   19. Beyond LS: goroutines & channels, defer, interfaces, embedding

package main

import (
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"
)


// ============================================================
// 01. Comments & program structure
//   LS: shipped (# comments). Go: //, /* */. Every file declares a
//   package; main package needs func main().
// ============================================================

// Line comments use //.
/* Block comments use /* ... */. */
// Doc comments live immediately above a declaration and feed `go doc`.


// ============================================================
// 02. Variables & assignment
//   LS: shipped. Go: `var` declares; `:=` is short-form declaration (only
//   inside functions); ALL declared vars must be used (compile error).
// ============================================================

var topLevelX int = 10

func section02() {
	var x int = 10
	x = 20
	x += 5

	y := 42 // short declaration — only inside functions
	_ = y

	// Parallel multi-assignment: RHS fully evaluated first.
	a, b := 1, 2
	a, b = b, a // idiomatic swap
	_ = a
	_ = b

	// `_` blackholes a value (often used to skip a returned error or index).
	_, _ = 1, 2
}


// ============================================================
// 03. Numbers, booleans, nil
//   LS: shipped. Go: many numeric types (int, int64, float64, uint, …);
//   `nil` is the zero value of pointers, slices, maps, channels, funcs.
// ============================================================

func section03() {
	var n int = 1_000_000 // underscores allowed (Go 1.13+)
	var pi float64 = 3.14159
	var big int64 = 1 << 62
	var t bool = true
	_ = n
	_ = pi
	_ = big
	_ = t

	// "Nothing" depends on the type. For non-pointer scalars there IS no
	// null — they have *zero values* (0, "", false). For ref types:
	var s []int          // nil slice
	var m map[string]int // nil map
	var f func()         // nil func
	_ = s
	_ = m
	_ = f
}


// ============================================================
// 04. Strings
//   LS: shipped. Go: immutable, UTF-8 byte sequences. f-strings via
//   fmt.Sprintf. Multi-line via backtick raw strings.
// ============================================================

func section04() {
	greeting := "hello"
	name := "world"
	fmt.Println(greeting + " " + name) // concatenation

	fmt.Println("say \"hi\"")
	fmt.Println("line1\nline2")

	// fmt.Sprintf is Go's "f-string". %v is the universal verb.
	fmt.Println(fmt.Sprintf("hello %s, you are %d", name, 30))

	// Raw string with backticks: no escape interpretation, multi-line.
	multi := `
  line 1
  line 2
`
	_ = multi
}


// ============================================================
// 05. Operators
//   LS: shipped (+/-*//**, comparison, boolean). Go: no `**` (use math.Pow);
//   `%` for modulo (LS plans this for Later). Bitwise: & | ^ << >> &^.
// ============================================================

func section05() {
	fmt.Println(1 + 2*3)
	fmt.Println(10 % 3)
	fmt.Println(10 / 3) // integer division when both ints

	// Boolean — short-circuit.
	fmt.Println(true && false)
	fmt.Println(true || false)
	fmt.Println(!true)
}


// ============================================================
// 06. if / else if / else
//   LS: shipped (statement). if-expression planned (Next).
//   Go: no if-expression; braces always required; ()-around-cond forbidden.
//   Go's `if` can declare a local: `if v, ok := m[k]; ok { ... }`.
// ============================================================

func classify(value int) int {
	if value < 0 {
		return -1
	} else if value == 0 {
		return 0
	}
	return 1
}

// `if`-with-init: the local `v` is scoped to the if/else branches.
func lookup(m map[string]int, k string) {
	if v, ok := m[k]; ok {
		fmt.Println("got", v)
	} else {
		fmt.Println("missing")
	}
}


// ============================================================
// 07. for / break / continue (Go has no while!)
//   LS: shipped (while/break/continue). Go: ONE loop keyword (`for`)
//   covers C-for, while, and infinite. Guard-if planned (Later) — Go
//   has no postfix `if`.
// ============================================================

func section07() {
	// C-style: init; cond; post
	for i := 0; i < 5; i++ {
		fmt.Println(i)
	}

	// While-style: cond only.
	i := 0
	for i < 10 {
		i++
		if i == 3 {
			continue
		}
		if i == 7 {
			break
		}
		fmt.Println(i)
	}

	// Infinite.
	// for { break }

	// Labeled break/continue for nested loops.
outer:
	for r := 0; r < 3; r++ {
		for c := 0; c < 3; c++ {
			if r == 1 && c == 1 {
				break outer
			}
		}
	}
}


// ============================================================
// 08. for-each (range)
//   LS: planned (Next). Go's `range` is the for-each.
// ============================================================

func section08() {
	total := 0
	for _, item := range []int{10, 20, 30} {
		total += item
	}
	_ = total

	// range gives (index, value) for slices/arrays/strings, (key, value) for maps.
	for i, item := range []string{"a", "b", "c"} {
		fmt.Println(i, item)
	}

	// Go 1.22+: `for i := range 5` iterates 0..4 — finally a clean numeric range.
	for i := range 5 {
		fmt.Println(i)
	}
}


// ============================================================
// 09. Functions, multiple returns, variadic
//   LS: shipped (functions, closures). Defaults & kwargs planned (Later) —
//   Go has NEITHER. Go's signature feature: *multiple return values*,
//   the design ancestor of "error as second return".
// ============================================================

func add(a, b int) int {
	return a + b
}

// Multiple return values. LS's planned parallel multi-assignment maps
// well to this: `x, y := f()`.
func divmod(a, b int) (int, int) {
	return a / b, a % b
}

// Named returns: declare result names in the signature, `return` returns them.
func sumAndMean(xs []int) (sum int, mean float64) {
	for _, v := range xs {
		sum += v
	}
	mean = float64(sum) / float64(len(xs))
	return
}

// Variadic: `...T` collects extra args. Pass a slice with `slice...`.
func variadic(args ...int) int {
	total := 0
	for _, v := range args {
		total += v
	}
	return total
}

// Closures.
func makeCounter() func() int {
	count := 0
	return func() int {
		count++
		return count
	}
}


// ============================================================
// 10. Function literals (no shorthand)
//   LS: shipped (full-form). Arrow shorthand `x -> x*2` planned (Next).
//   Go has no shorthand; `func(x int) int { return x * 2 }` is the form.
// ============================================================

var double = func(x int) int { return x * 2 }
var addXY = func(x, y int) int { return x + y }


// ============================================================
// 11. Higher-order functions & "pipelines"
//   LS: HOFs work today. Pipeline `|>` planned (Next) — Go has no `|>`,
//   no generic map/filter in the std lib until 1.21 (slices package).
//   Idiomatic Go usually writes the loop explicitly.
// ============================================================

func mapInt(xs []int, fn func(int) int) []int {
	out := make([]int, len(xs))
	for i, v := range xs {
		out[i] = fn(v)
	}
	return out
}

func filterInt(xs []int, pred func(int) bool) []int {
	out := []int{}
	for _, v := range xs {
		if pred(v) {
			out = append(out, v)
		}
	}
	return out
}

// With Go 1.18+ generics:
func mapG[T, U any](xs []T, fn func(T) U) []U {
	out := make([]U, len(xs))
	for i, v := range xs {
		out[i] = fn(v)
	}
	return out
}


// ============================================================
// 12. Slices & arrays
//   LS: planned (Next). Go distinguishes:
//     - array [N]T: fixed-length, value semantics
//     - slice  []T: dynamic, header (pointer + len + cap), reference-y
//   The slice is the everyday "list".
// ============================================================

func section12() {
	nums := []int{1, 2, 3, 4, 5}
	fmt.Println(nums[0])
	fmt.Println(nums[len(nums)-1])  // no negative indexing in Go
	fmt.Println(nums[1:4])           // slicing
	nums = append(nums, 6)
	nums[0] = 100
	fmt.Println(len(nums), cap(nums))

	// Fixed-size array — rare in idiomatic Go.
	var fixed [3]int = [3]int{1, 2, 3}
	_ = fixed
}


// ============================================================
// 13. Maps
//   LS: planned (Next). Go: `map[K]V`. Two-value lookup distinguishes
//   "missing" from "zero value": `v, ok := m[k]`.
// ============================================================

func section13() {
	person := map[string]any{"name": "Alice", "age": 30}
	fmt.Println(person["name"])
	person["role"] = "admin"
	delete(person, "role")

	// "Get with default" idiom.
	if name, ok := person["name"].(string); ok {
		fmt.Println(name)
	}
}


// ============================================================
// 14. Sets (map[T]struct{} idiom)
//   LS: planned (Later). Go has NO set type — idiomatic is
//   `map[T]struct{}` (empty struct is zero-sized). Design lesson:
//   small core wins; users compose what they need.
// ============================================================

func section14() {
	primes := map[int]struct{}{
		2: {}, 3: {}, 5: {}, 7: {},
	}
	primes[11] = struct{}{}     // add
	_, has := primes[2]         // has?
	delete(primes, 3)           // remove
	fmt.Println(has, len(primes))
}


// ============================================================
// 15. "Pattern matching" via type switch
//   LS: planned (Next). Go has NO match — type-switch is the closest.
//   `switch v := x.(type) { case T1: ... }` narrows v inside each arm.
// ============================================================

func describe(value any) string {
	switch v := value.(type) {
	case nil:
		return "nil"
	case int:
		switch {
		case v == 0:
			return "zero"
		case v < 0:
			return "negative"
		default:
			return "positive"
		}
	case []int:
		switch len(v) {
		case 0:
			return "empty"
		case 1:
			return fmt.Sprintf("one: %d", v[0])
		default:
			return fmt.Sprintf("first %d, then %d more", v[0], len(v)-1)
		}
	case map[string]any:
		if name, ok := v["name"].(string); ok {
			return "named " + name
		}
		return "anonymous map"
	default:
		return fmt.Sprintf("unknown: %v", v)
	}
}

// Destructuring: Go only "destructures" multiple return values; there's
// no slice/map destructure syntax. You use indexing or named fields.


// ============================================================
// 16. Error handling (error-as-value, not exceptions)
//   LS: planned (Later) — try/catch. Go's design choice: errors are values,
//   returned alongside the result. No throw, no try. `panic` exists but
//   is reserved for unrecoverable bugs.
// ============================================================

var ErrNotFound = errors.New("not found")

func findUser(id int) (string, error) {
	if id < 0 {
		return "", fmt.Errorf("bad id %d: %w", id, ErrNotFound)
	}
	return "Alice", nil
}

func section16() {
	name, err := findUser(-1)
	if err != nil {
		// errors.Is checks wrapped errors — like an exception type test.
		if errors.Is(err, ErrNotFound) {
			fmt.Println("not found")
		} else {
			fmt.Println("other error")
		}
		return
	}
	fmt.Println(name)
}


// ============================================================
// 17. Methods on types (dot-call on receivers)
//   LS: planned (Later). Go methods are functions with a *receiver*:
//   `func (r ReceiverType) Method() { }`. No classes — just types + methods.
// ============================================================

type Greeter struct {
	Name string
}

// Value receiver — operates on a copy.
func (g Greeter) Hello() string {
	return "Hello, " + g.Name
}

// Pointer receiver — can mutate the original.
func (g *Greeter) Rename(name string) {
	g.Name = name
}

func section17() {
	g := Greeter{Name: "Alice"}
	fmt.Println(g.Hello())
	g.Rename("Bob")
	fmt.Println(g.Hello())

	// Builtin-style methods on slices/strings live in packages.
	fmt.Println(strings.ToUpper("hello"))
	fmt.Println(strings.Split("a,b,c", ","))
	fmt.Println(strings.Join([]string{"a", "b"}, ","))
}


// ============================================================
// 18. Inspect / debug
//   LS: planned (Future). Go: fmt verbs %v, %+v, %#v give increasingly
//   detailed dumps; `reflect.TypeOf(x)` for runtime types.
// ============================================================

func section18() {
	x := []int{1, 2, 3}
	fmt.Printf("%v\n", x)   // [1 2 3]
	fmt.Printf("%+v\n", x)  // [1 2 3]
	fmt.Printf("%#v\n", x)  // []int{1, 2, 3}  — Go-syntax representation
	fmt.Printf("%T\n", x)   // []int
}


// ============================================================
// 19. Beyond Lucky Script — Go gems
//   LS: not planned.
// ============================================================

// --- Goroutines & channels: CSP-style concurrency ---
// `go fn()` spawns a lightweight goroutine. Channels (`chan T`) are
// typed conduits used for communication — "don't share memory, communicate".

func produce(out chan<- int) {
	for i := 1; i <= 3; i++ {
		out <- i * i
	}
	close(out)
}

func goroutinesDemo() {
	ch := make(chan int, 3)
	go produce(ch)
	for v := range ch {
		fmt.Println(v)
	}

	// WaitGroup syncs goroutine completion without channel signaling.
	var wg sync.WaitGroup
	for i := 0; i < 3; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			time.Sleep(time.Millisecond)
			_ = i
		}(i)
	}
	wg.Wait()
}

// `select` waits on multiple channel operations — the multiplex primitive.
func selectDemo(a, b <-chan int) int {
	select {
	case v := <-a:
		return v
	case v := <-b:
		return v
	case <-time.After(time.Second):
		return -1
	}
}


// --- defer: LIFO cleanup at function exit ---
// `defer` schedules a call to run when the enclosing function returns.
// Idiomatic for closing resources, unlocking mutexes, error wrapping.

func deferDemo() (result string) {
	defer fmt.Println("3. deferred — runs last")
	defer fmt.Println("2. deferred — runs second")
	fmt.Println("1. body")
	defer func() {
		// Deferred funcs can read/modify named returns.
		result = "modified by defer"
	}()
	return "from body"
}


// --- Interfaces: structural, implicit ---
// A type satisfies an interface just by having the right methods. No
// "implements" keyword. LS could borrow this for dot-method calls later.

type Stringer interface {
	String() string
}

type Animal struct {
	Name string
}

func (a Animal) String() string {
	return "Animal(" + a.Name + ")"
}

func describeIt(s Stringer) {
	fmt.Println(s.String())
}


// --- Struct embedding: composition over inheritance ---
// Embed a type by writing its name as a field with no name. The outer
// struct gets all the embedded type's fields and methods promoted.

type Base struct {
	ID int
}

func (b Base) ShowID() {
	fmt.Println("id:", b.ID)
}

type Extended struct {
	Base  // embedded — Extended.ShowID() works
	Label string
}

func embeddingDemo() {
	e := Extended{Base: Base{ID: 42}, Label: "x"}
	e.ShowID()        // promoted method
	fmt.Println(e.ID) // promoted field
}


// ============================================================
// main — minimal driver so the file is a valid Go program
// ============================================================

func main() {
	// Discard everything; this file is for reading, not running.
	_ = topLevelX
	_ = classify
	_ = lookup
	_ = add
	_ = divmod
	_ = sumAndMean
	_ = variadic
	_ = makeCounter
	_ = double
	_ = addXY
	_ = mapInt
	_ = filterInt
	_ = mapG[int, int]
	_ = describe
	_ = findUser
	_ = describeIt
	_ = embeddingDemo
	_ = goroutinesDemo
	_ = selectDemo
	_ = deferDemo
}
