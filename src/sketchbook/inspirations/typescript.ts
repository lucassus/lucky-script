// ============================================================
// Lucky Script Inspirations — TypeScript
// ============================================================
// Assumed: TypeScript 5.x.
// See ../roadmap.md for Lucky Script's feature roadmap.
//
// TypeScript = JavaScript + a static type system. This file focuses
// on what types ADD; for pure-JS behavior, see javascript.js.
// LS is dynamically typed and has no types on the roadmap — this
// file is here in case you ever consider adding gradual typing.
//
// Sections:
//   01. Comments & program structure
//   02. Variables & assignment (with type annotations)
//   03. Primitive types, null, undefined, never, unknown
//   04. Strings & template literal types
//   05. Operators (mostly inherited from JS)
//   06. if / else if / else (with narrowing)
//   07. while, break, continue
//   08. for-each
//   09. Functions: signatures, generics, overloads
//   10. Arrow functions
//   11. Higher-order functions & typed pipelines
//   12. Arrays & tuples
//   13. Objects, interfaces, records
//   14. Sets & Maps (typed)
//   15. Pattern matching via discriminated unions
//   16. Error handling & typed Result
//   17. Methods on types (dot-call)
//   18. Inspect / debug
//   19. Beyond LS: generics, conditional types, mapped types, satisfies
// ============================================================


// ============================================================
// 01. Comments & program structure
//   LS: shipped (# comments). TS uses // and /* */; JSDoc + @-tags
//   interplay with the type system (e.g., @ts-expect-error).
// ============================================================

// @ts-expect-error tells the checker "this line should error"; if it
// stops erroring, TS will tell you so. Useful for regression tests.

/** JSDoc with TS types is parsed by the language server. */


// ============================================================
// 02. Variables & assignment
//   LS: shipped. Adds optional type annotations. `const` + literals gives
//   you the narrowest type for free; `as const` freezes a value's type.
// ============================================================

let x: number = 10;
x = 20;

const PI: number = 3.14159;       // type is `number`
const TAU = 6.28318;               // inferred `number`
const FLAG = "on";                 // inferred `string`
const LITERAL = "on" as const;     // inferred '"on"' — a string literal type

// `readonly` modifier on properties / arrays / tuples.
const tuple = [1, 2, 3] as const;  // readonly [1, 2, 3]


// ============================================================
// 03. Primitive types, null, undefined, never, unknown
//   LS: shipped. TS distinguishes `null`, `undefined`, `void`, `never`,
//   `unknown`, `any` — a richer null story than LS plans to expose.
// ============================================================

const n: number = 1_000_000;
const big: bigint = 10n ** 100n;
const t: boolean = true;
const nothing: null = null;
let notSet: undefined;
const anything: unknown = "anything";     // must narrow before use
const escape: any = "type system off";    // last resort, avoid

// `never` is the type of an expression that can't produce a value
// (a thrown error, an infinite loop, an exhaustive-case fallthrough).
function fail(msg: string): never {
  throw new Error(msg);
}

// Union types: a value is "one of these".
type StringOrNumber = string | number;

// Type guards narrow inside a branch.
function describePrim(value: StringOrNumber): string {
  if (typeof value === "string") {
    return value.toUpperCase();      // narrowed to `string`
  }
  return value.toFixed(2);            // narrowed to `number`
}


// ============================================================
// 04. Strings & template literal types
//   LS: shipped (escapes, concat). f-strings planned (Later).
//   TS adds *template literal types* — types built from string shapes.
// ============================================================

const greeting = "hello";
const name = "world";
console.log(`${greeting}, ${name}`);

// A type that is the union of all "on_<event>" strings:
type EventName = "click" | "hover" | "focus";
type Handler = `on_${EventName}`;       // "on_click" | "on_hover" | "on_focus"

const h: Handler = "on_click";          // ok
// const bad: Handler = "on_drag";      // type error


// ============================================================
// 05. Operators
//   LS: shipped. Same operator set as JS — types just check operand
//   compatibility. `+` rejects `number + string` mixing in strict mode.
// ============================================================

console.log(1 + 2 * 3 ** 2);
console.log(10 % 3);

// `as` is the casting escape hatch — useful but trust-degrading.
const cast = "42" as unknown as number;
void cast;


// ============================================================
// 06. if / else if / else
//   LS: shipped (statement). if-expression planned (Next).
//   TS adds *control-flow narrowing*: types refine inside branches.
// ============================================================

function classify(value: number): -1 | 0 | 1 {
  if (value < 0) return -1;
  if (value === 0) return 0;
  return 1;
}

function len(value: string | null): number {
  if (value === null) return 0;
  return value.length;                  // narrowed to `string`
}


// ============================================================
// 07. while, break, continue
//   LS: shipped. Identical to JS at the syntax level.
// ============================================================

let i = 0;
while (i < 10) {
  i += 1;
  if (i === 3) continue;
  if (i === 7) break;
  console.log(i);
}


// ============================================================
// 08. for-each
//   LS: planned (Next). `for...of` is the typed for-each.
// ============================================================

const nums: number[] = [1, 2, 3, 4, 5];

let total = 0;
for (const item of [10, 20, 30]) {
  total += item;
}


// ============================================================
// 09. Functions: signatures, generics, overloads
//   LS: shipped (functions, closures). Defaults/kwargs planned (Later).
//   TS adds parameter types, return types, generic type parameters,
//   and overload signatures.
// ============================================================

function add(a: number, b: number): number {
  return a + b;
}

function greet(person: string, greeting: string = "Hello"): void {
  console.log(`${greeting}, ${person}`);
}

// Optional parameter: `?` makes a parameter possibly-undefined.
function maybe(label: string, value?: number): void {
  console.log(label, value ?? "n/a");
}

// Generic function: `T` is inferred from the call site.
function identity<T>(value: T): T {
  return value;
}

const num = identity(42);          // T = number
const str = identity("hi");        // T = string
void num; void str;

// Overload signatures: multiple call shapes, one implementation.
function parse(input: string): number;
function parse(input: number): string;
function parse(input: string | number): string | number {
  return typeof input === "string" ? Number(input) : String(input);
}

function makeCounter(): () => number {
  let count = 0;
  return () => (count += 1);
}


// ============================================================
// 10. Arrow functions
//   LS: shipped (full-form). Arrow shorthand `x -> x*2` planned (Next).
//   TS arrows have the same `=>` syntax as JS, with optional return types.
// ============================================================

const double: (x: number) => number = x => x * 2;
const addXY = (x: number, y: number): number => x + y;
const constFn = (): 42 => 42;
void double; void addXY; void constFn;


// ============================================================
// 11. Higher-order functions & typed pipelines
//   LS: HOFs work today. Pipeline `|>` planned (Next). TC39's pipeline
//   proposal is still in flight; nothing native yet.
// ============================================================

const doubled = nums.map(v => v * 2);              // inferred number[]
const positives = nums.filter((v): v is number => v > 2);
const total2 = nums.reduce((acc, v) => acc + v, 0);
void doubled; void positives; void total2;

// `v is number` is a *user-defined type guard*: tells TS to narrow on true.


// ============================================================
// 12. Arrays & tuples
//   LS: planned (Next). TS distinguishes:
//     - Array<T> / T[]: variable length, uniform type
//     - tuple [A, B, C]: fixed length, positional types
// ============================================================

const arr: number[] = [1, 2, 3, 4, 5];
const arr2: Array<number> = [1, 2, 3];
void arr2;

// Tuple — fixed shape, useful for "this returns a pair":
const pair: [string, number] = ["Alice", 30];
const [pName, pAge] = pair;        // pName: string, pAge: number
void pName; void pAge;

// Readonly array / tuple — disallows .push, [i] = ..., etc.
const frozen: readonly number[] = [1, 2, 3];
void frozen;


// ============================================================
// 13. Objects, interfaces, records
//   LS: planned (Next). TS distinguishes:
//     - `interface`: extensible structural shape
//     - `type` alias: also structural, but can be unions / mapped / etc.
//     - `Record<K, V>`: dict-shaped object with uniform key/value types
// ============================================================

interface Person {
  readonly name: string;
  age: number;
  role?: string;                   // optional property
}

type PointType = { x: number; y: number };

const person: Person = { name: "Alice", age: 30 };
person.age += 1;
// person.name = "Bob";            // error: name is readonly

const ages: Record<string, number> = { alice: 30, bob: 17 };
void ages;

// Index signatures for dynamic-key shapes.
interface Lookup {
  [key: string]: number;
}


// ============================================================
// 14. Sets & Maps (typed)
//   LS: planned (Later). Set<T> / Map<K, V> carry element types.
// ============================================================

const primes: Set<number> = new Set([2, 3, 5, 7]);
primes.add(11);

const cache: Map<string, number> = new Map();
cache.set("a", 1);


// ============================================================
// 15. Pattern matching via discriminated unions
//   LS: planned (Next). TS has no `match` statement, but discriminated
//   unions + `switch` + `never`-check give *exhaustive* matching.
// ============================================================

type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; side: number }
  | { kind: "rect"; w: number; h: number };

function area(s: Shape): number {
  switch (s.kind) {
    case "circle":
      return Math.PI * s.radius ** 2;
    case "square":
      return s.side ** 2;
    case "rect":
      return s.w * s.h;
    default: {
      // If a new variant is added to Shape and not handled here, TS will
      // tell us via this `never` assignment — exhaustiveness for free.
      const _exhaustive: never = s;
      return _exhaustive;
    }
  }
}
void area;

// Destructuring with types.
const { name: personName, age: personAge }: Person = person;
const [a, b, c]: [number, number, number] = [1, 2, 3];
void personName; void personAge; void a; void b; void c;


// ============================================================
// 16. Error handling & typed Result
//   LS: planned (Later) — try/catch. TS adds:
//     - `unknown` for caught errors (TS 4.0+ via useUnknownInCatchVariables)
//     - convention of "Result-like" union types instead of throwing
// ============================================================

try {
  if (nums[99] === undefined) throw new RangeError("oob");
} catch (e: unknown) {
  if (e instanceof RangeError) {
    console.log(`range: ${e.message}`);
  } else if (e instanceof Error) {
    console.log(`error: ${e.message}`);
  } else {
    console.log("non-error throw");
  }
}

// Result type: encode failure in the type system instead of throwing.
type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function safeParseInt(s: string): Result<number> {
  const n = Number(s);
  return Number.isFinite(n)
    ? { ok: true, value: n }
    : { ok: false, error: `not a number: ${s}` };
}

const r = safeParseInt("42");
if (r.ok) console.log(r.value);
else console.log(r.error);


// ============================================================
// 17. Methods on types (dot-call)
//   LS: planned (Later). Identical to JS at runtime; TS types each method.
// ============================================================

console.log("hello".toUpperCase());
console.log([1, 2, 3].includes(2));
console.log(Object.entries({ a: 1 }));


// ============================================================
// 18. Inspect / debug
//   LS: planned (Future). TS adds *type-level* inspection via `typeof`,
//   `keyof`, hover-tips in editors, and "Expand type" assist.
// ============================================================

const xx = [1, 2, 3];
console.log(xx);
type XX = typeof xx;                 // number[]
type Keys = keyof Person;            // "name" | "age" | "role"
void {} as XX; void {} as Keys;


// ============================================================
// 19. Beyond Lucky Script — TypeScript gems
//   LS: not planned (LS has no type system).
// ============================================================

// --- Generic constraints, defaults, conditional inference ---
function firstKey<T extends object>(obj: T): keyof T {
  return Object.keys(obj)[0] as keyof T;
}

function withDefault<T = string>(value: T): T {
  return value;
}

// --- Discriminated unions, deeply ---
type Action =
  | { type: "add"; payload: number }
  | { type: "remove"; id: string }
  | { type: "clear" };

function reducer(state: number[], action: Action): number[] {
  switch (action.type) {
    case "add":
      return [...state, action.payload];        // payload narrowed to number
    case "remove":
      return state.filter(v => String(v) !== action.id);
    case "clear":
      return [];
  }
}
void reducer;

// --- Conditional types: types-as-functions on types ---
type NonNull<T> = T extends null | undefined ? never : T;
type T1 = NonNull<string | null>;             // string

// `infer` extracts a type variable inside a conditional.
type ReturnTypeOf<F> = F extends (...args: any[]) => infer R ? R : never;
type T2 = ReturnTypeOf<() => number>;          // number
void {} as T1; void {} as T2;

// --- Mapped types: build object types from other types ---
type ReadonlyDeep<T> = { readonly [K in keyof T]: T[K] };
type PartialDeep<T> = { [K in keyof T]?: T[K] };

type FrozenPerson = ReadonlyDeep<Person>;
type DraftPerson = PartialDeep<Person>;
void {} as FrozenPerson; void {} as DraftPerson;

// --- Utility types shipped with TS ---
type P1 = Partial<Person>;          // all keys optional
type P2 = Required<Person>;         // all keys required
type P3 = Pick<Person, "name">;     // { name: string }
type P4 = Omit<Person, "role">;     // { name; age }
type P5 = Readonly<Person>;
void {} as P1; void {} as P2; void {} as P3; void {} as P4; void {} as P5;

// --- `satisfies`: check shape WITHOUT widening the inferred type ---
const palette = {
  red: [255, 0, 0],
  green: [0, 255, 0],
  blue: [0, 0, 255],
} satisfies Record<string, [number, number, number]>;
// `palette.red` keeps the type `[number, number, number]`, not `number[]`,
// AND TS verifies palette matches the constraint. Without `satisfies`, you
// pick one or the other.

// --- Branded types: nominal typing on a structural foundation ---
type UserId = string & { readonly __brand: "UserId" };
function makeUserId(s: string): UserId {
  return s as UserId;
}
const uid = makeUserId("abc");
// const wrong: UserId = "abc";     // error — plain string isn't UserId
void uid;
