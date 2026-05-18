import { expect, test } from "vitest";

import type { Bytecode } from "../compiler/bytecode";
import {
  ArityMismatch,
  FrameStackOverflow,
  NotCallable,
  StackOverflow,
  StackUnderflow,
  UndefinedVariable,
  VmError,
} from "./errors";
import { run } from "./run";
import type { Value } from "./value";

// Scope: VM-only edge cases (runtime errors, resource limits, opcode semantics
// the surface language cannot conveniently express). Happy-path program
// behavior belongs in integration.test.ts — see src/v2/AGENTS.md § Tests.

function buildMainBytecode(code: Bytecode["main"]["code"]): Bytecode {
  return { main: { name: "__main", params: [], code }, functions: [] };
}

/**
 * Assert that `run()` returned a NumberValue and unwrap it. Fails as a Vitest
 * assertion (not a thrown Error) when the value is missing or a closure, so
 * the test report stays diff-friendly.
 *
 * Intentionally does NOT accept `undefined` results — tests that expect an
 * empty-stack HALT should assert `expect(run(bytecode)).toBeUndefined()` directly.
 */
function numberOf(v: Value | undefined): number {
  if (v?.kind !== "number") {
    expect.fail(
      `expected number value, got ${v === undefined ? "undefined" : v.kind}`,
    );
  }
  return v.value;
}

// ── Category A: errors the compiler shields you from ─────────────────────────
//
// Hand-crafted bytecode is the only way to reach these branches; well-typed
// source programs never produce them.

test("ADD with too few operands throws StackUnderflow", () => {
  const bytecode = buildMainBytecode([{ opcode: "ADD" }]);
  expect(() => run(bytecode)).toThrow(StackUnderflow);
});

test("LOAD of an unbound name throws UndefinedVariable", () => {
  const bytecode = buildMainBytecode([{ opcode: "LOAD", name: "nope" }]);
  expect(() => run(bytecode)).toThrow(UndefinedVariable);
});

test("ASSIGN to an unbound name throws UndefinedVariable", () => {
  const bytecode = buildMainBytecode([
    { opcode: "PUSH", value: 1 },
    { opcode: "ASSIGN", name: "nope" },
    { opcode: "HALT" },
  ]);
  expect(() => run(bytecode)).toThrow(UndefinedVariable);
});

test("POP with empty operand stack throws StackUnderflow", () => {
  const bytecode = buildMainBytecode([{ opcode: "POP" }, { opcode: "HALT" }]);
  expect(() => run(bytecode)).toThrow(StackUnderflow);
});

test("DUP with empty operand stack throws StackUnderflow", () => {
  const bytecode = buildMainBytecode([{ opcode: "DUP" }, { opcode: "HALT" }]);
  expect(() => run(bytecode)).toThrow(StackUnderflow);
});

test("CALL on a non-closure value throws NotCallable", () => {
  const bytecode = buildMainBytecode([
    { opcode: "PUSH", value: 42 },
    { opcode: "CALL", argc: 0 },
    { opcode: "HALT" },
  ]);
  expect(() => run(bytecode)).toThrow(NotCallable);
});

test("CALL with too few arguments throws ArityMismatch", () => {
  const bytecode: Bytecode = {
    main: {
      name: "__main",
      params: [],
      code: [
        { opcode: "MAKE_CLOSURE", fnIndex: 0 },
        { opcode: "CALL", argc: 0 }, // proto expects 1
        { opcode: "HALT" },
      ],
    },
    functions: [
      {
        name: "needsOne",
        params: ["x"],
        code: [{ opcode: "LOAD", name: "x" }, { opcode: "RETURN" }],
      },
    ],
  };
  expect(() => run(bytecode)).toThrow(ArityMismatch);
});

test("CALL with too many arguments throws ArityMismatch", () => {
  const bytecode: Bytecode = {
    main: {
      name: "__main",
      params: [],
      code: [
        { opcode: "MAKE_CLOSURE", fnIndex: 0 },
        { opcode: "PUSH", value: 1 },
        { opcode: "PUSH", value: 2 },
        { opcode: "CALL", argc: 2 }, // proto expects 0
        { opcode: "HALT" },
      ],
    },
    functions: [
      {
        name: "zero",
        params: [],
        code: [{ opcode: "PUSH", value: 0 }, { opcode: "RETURN" }],
      },
    ],
  };
  expect(() => run(bytecode)).toThrow(ArityMismatch);
});

test("RETURN with empty operand stack throws StackUnderflow", () => {
  const bytecode: Bytecode = {
    main: {
      name: "__main",
      params: [],
      code: [
        { opcode: "MAKE_CLOSURE", fnIndex: 0 },
        { opcode: "CALL", argc: 0 },
        { opcode: "HALT" },
      ],
    },
    functions: [
      {
        name: "noReturnValue",
        params: [],
        code: [{ opcode: "RETURN" }], // no value pushed before RETURN
      },
    ],
  };
  expect(() => run(bytecode)).toThrow(StackUnderflow);
});

test("HALT inside a callee frame throws VmError", () => {
  // The compiler emits HALT only at the end of __main; reaching this branch
  // requires hand-crafted bytecode.
  const bytecode: Bytecode = {
    main: {
      name: "__main",
      params: [],
      code: [
        { opcode: "MAKE_CLOSURE", fnIndex: 0 },
        { opcode: "CALL", argc: 0 },
        { opcode: "HALT" },
      ],
    },
    functions: [
      {
        name: "bad",
        params: [],
        code: [{ opcode: "PUSH", value: 1 }, { opcode: "HALT" }],
      },
    ],
  };
  expect(() => run(bytecode)).toThrow(VmError);
  expect(() => run(bytecode)).toThrow(/HALT/);
});

test("MAKE_CLOSURE with out-of-range fnIndex throws", () => {
  const bytecode: Bytecode = {
    main: {
      name: "__main",
      params: [],
      code: [{ opcode: "MAKE_CLOSURE", fnIndex: 99 }, { opcode: "HALT" }],
    },
    functions: [],
  };
  expect(() => run(bytecode)).toThrow(/function index/);
});

// ── Category B: numeric edge cases ───────────────────────────────────────────
//
// Lucky inherits JavaScript's IEEE-754 behavior for all arithmetic. These
// tests pin down the semantics so future "improvements" (e.g. throwing on
// DIV-by-zero) become an explicit, intentional break.

test("DIV by zero produces Infinity", () => {
  const bytecode = buildMainBytecode([
    { opcode: "PUSH", value: 1 },
    { opcode: "PUSH", value: 0 },
    { opcode: "DIV" },
    { opcode: "HALT" },
  ]);
  expect(numberOf(run(bytecode))).toBe(Infinity);
});

test("DIV of zero by zero produces NaN", () => {
  const bytecode = buildMainBytecode([
    { opcode: "PUSH", value: 0 },
    { opcode: "PUSH", value: 0 },
    { opcode: "DIV" },
    { opcode: "HALT" },
  ]);
  expect(Number.isNaN(numberOf(run(bytecode)))).toBe(true);
});

test("EQ on NaN with itself produces 0", () => {
  // `NaN === NaN` is false in JS; Lucky inherits that.
  const bytecode = buildMainBytecode([
    { opcode: "PUSH", value: NaN },
    { opcode: "PUSH", value: NaN },
    { opcode: "EQ" },
    { opcode: "HALT" },
  ]);
  expect(numberOf(run(bytecode))).toBe(0);
});

test.each([
  ["LT" as const],
  ["GT" as const],
  ["LTE" as const],
  ["GTE" as const],
])("%s with a NaN operand produces 0", (op) => {
  const bytecode = buildMainBytecode([
    { opcode: "PUSH", value: NaN },
    { opcode: "PUSH", value: 1 },
    { opcode: op },
    { opcode: "HALT" },
  ]);
  expect(numberOf(run(bytecode))).toBe(0);
});

// JMP_IF_ZERO treats only values that satisfy `=== 0` (i.e. 0 and -0) as zero.
// Each row hand-rolls a tiny program: PUSH operand, JMP_IF_ZERO to ip 4
// (skipping the fall-through arm), HALT in whichever arm runs.
test.each([
  [0.5, 1, "fractional, !== 0, falls through"],
  [-0, 999, "-0 === 0, jumps"],
  [NaN, 1, "NaN !== 0, falls through"],
] as const)("JMP_IF_ZERO with %s lands on %s (%s)", (operand, expected, _) => {
  const bytecode = buildMainBytecode([
    { opcode: "PUSH", value: operand },
    { opcode: "JMP_IF_ZERO", target: 4 },
    { opcode: "PUSH", value: 1 }, // fall-through arm
    { opcode: "HALT" },
    { opcode: "PUSH", value: 999 }, // jump target arm
    { opcode: "HALT" },
  ]);
  expect(numberOf(run(bytecode))).toBe(expected);
});

test("NOT of a non-zero fractional value produces 0", () => {
  // Only literal 0 is "falsy"; any other number negates to 0.
  const bytecode = buildMainBytecode([
    { opcode: "PUSH", value: 0.5 },
    { opcode: "NOT" },
    { opcode: "HALT" },
  ]);
  expect(numberOf(run(bytecode))).toBe(0);
});

test("NOT of NaN produces 0", () => {
  // Consistent with the JMP_IF_ZERO/NaN case: NaN is not zero.
  const bytecode = buildMainBytecode([
    { opcode: "PUSH", value: NaN },
    { opcode: "NOT" },
    { opcode: "HALT" },
  ]);
  expect(numberOf(run(bytecode))).toBe(0);
});

// ── Category C: closure / environment semantics ──────────────────────────────
//
// These pin down behavior of MAKE_CLOSURE / CALL / EQ on closures that is
// either invariant-level (capture by reference) or impossible to express
// from source (cross-kind equality, distinct closures over the same proto).

test("MAKE_CLOSURE captures the env by reference, sees later DEFINEs", () => {
  // The closure is created BEFORE "x" exists. By the time it runs, "x" has
  // been DEFINEd in the captured env, and LOAD "x" finds it.
  const bytecode: Bytecode = {
    main: {
      name: "__main",
      params: [],
      code: [
        { opcode: "MAKE_CLOSURE", fnIndex: 0 }, // capture env (no "x" yet)
        { opcode: "DEFINE", name: "f" },
        { opcode: "PUSH", value: 99 },
        { opcode: "DEFINE", name: "x" }, // DEFINEd after capture
        { opcode: "LOAD", name: "f" },
        { opcode: "CALL", argc: 0 },
        { opcode: "HALT" },
      ],
    },
    functions: [
      {
        name: "readX",
        params: [],
        code: [{ opcode: "LOAD", name: "x" }, { opcode: "RETURN" }],
      },
    ],
  };
  expect(numberOf(run(bytecode))).toBe(99);
});

test("Closures observe ASSIGN mutations of captured bindings", () => {
  const bytecode: Bytecode = {
    main: {
      name: "__main",
      params: [],
      code: [
        { opcode: "PUSH", value: 1 },
        { opcode: "DEFINE", name: "x" }, // x = 1
        { opcode: "MAKE_CLOSURE", fnIndex: 0 },
        { opcode: "DEFINE", name: "f" },
        { opcode: "PUSH", value: 42 },
        { opcode: "ASSIGN", name: "x" }, // mutate after capture
        { opcode: "LOAD", name: "f" },
        { opcode: "CALL", argc: 0 },
        { opcode: "HALT" },
      ],
    },
    functions: [
      {
        name: "readX",
        params: [],
        code: [{ opcode: "LOAD", name: "x" }, { opcode: "RETURN" }],
      },
    ],
  };
  expect(numberOf(run(bytecode))).toBe(42);
});

test("EQ on two distinct closures over the same proto produces 0", () => {
  // Closure equality is object identity. Two MAKE_CLOSURE evaluations of the
  // same function index produce distinct closure values.
  const bytecode: Bytecode = {
    main: {
      name: "__main",
      params: [],
      code: [
        { opcode: "MAKE_CLOSURE", fnIndex: 0 },
        { opcode: "MAKE_CLOSURE", fnIndex: 0 },
        { opcode: "EQ" },
        { opcode: "HALT" },
      ],
    },
    functions: [
      {
        name: "k",
        params: [],
        code: [{ opcode: "PUSH", value: 0 }, { opcode: "RETURN" }],
      },
    ],
  };
  expect(numberOf(run(bytecode))).toBe(0);
});

test("EQ between a closure and a number produces 0", () => {
  const bytecode: Bytecode = {
    main: {
      name: "__main",
      params: [],
      code: [
        { opcode: "MAKE_CLOSURE", fnIndex: 0 },
        { opcode: "PUSH", value: 1 },
        { opcode: "EQ" },
        { opcode: "HALT" },
      ],
    },
    functions: [
      {
        name: "k",
        params: [],
        code: [{ opcode: "PUSH", value: 0 }, { opcode: "RETURN" }],
      },
    ],
  };
  expect(numberOf(run(bytecode))).toBe(0);
});

test("NEQ on two distinct closures over the same proto produces 1", () => {
  const bytecode: Bytecode = {
    main: {
      name: "__main",
      params: [],
      code: [
        { opcode: "MAKE_CLOSURE", fnIndex: 0 },
        { opcode: "MAKE_CLOSURE", fnIndex: 0 },
        { opcode: "NEQ" },
        { opcode: "HALT" },
      ],
    },
    functions: [
      {
        name: "k",
        params: [],
        code: [{ opcode: "PUSH", value: 0 }, { opcode: "RETURN" }],
      },
    ],
  };
  expect(numberOf(run(bytecode))).toBe(1);
});

test("Arithmetic on a closure operand throws VmError", () => {
  const bytecode: Bytecode = {
    main: {
      name: "__main",
      params: [],
      code: [
        { opcode: "PUSH", value: 1 },
        { opcode: "MAKE_CLOSURE", fnIndex: 0 },
        { opcode: "ADD" },
        { opcode: "HALT" },
      ],
    },
    functions: [
      {
        name: "k",
        params: [],
        code: [{ opcode: "PUSH", value: 0 }, { opcode: "RETURN" }],
      },
    ],
  };
  expect(() => run(bytecode)).toThrow(VmError);
});

// ── Category D: resource limits ──────────────────────────────────────────────

test("operand stack overflow throws StackOverflow", () => {
  const bytecode = buildMainBytecode([
    { opcode: "PUSH", value: 1 },
    { opcode: "PUSH", value: 2 },
    { opcode: "PUSH", value: 3 },
  ]);
  expect(() => run(bytecode, { maxStackDepth: 2 })).toThrow(StackOverflow);
});

test("call frame overflow throws FrameStackOverflow", () => {
  const bytecode: Bytecode = {
    main: {
      name: "__main",
      params: [],
      code: [
        { opcode: "MAKE_CLOSURE", fnIndex: 0 },
        { opcode: "DEFINE", name: "rec" },
        { opcode: "LOAD", name: "rec" },
        { opcode: "CALL", argc: 0 },
        { opcode: "HALT" },
      ],
    },
    functions: [
      {
        name: "rec",
        params: [],
        code: [
          { opcode: "LOAD", name: "rec" },
          { opcode: "CALL", argc: 0 },
          { opcode: "RETURN" },
        ],
      },
    ],
  };
  expect(() => run(bytecode, { maxFrameDepth: 4 })).toThrow(FrameStackOverflow);
});

test("maxStackDepth and maxFrameDepth limits are independent", () => {
  const bytecode: Bytecode = {
    main: {
      name: "__main",
      params: [],
      code: [
        { opcode: "MAKE_CLOSURE", fnIndex: 0 },
        { opcode: "DEFINE", name: "rec" },
        { opcode: "LOAD", name: "rec" },
        { opcode: "CALL", argc: 0 },
        { opcode: "HALT" },
      ],
    },
    functions: [
      {
        name: "rec",
        params: [],
        code: [
          { opcode: "LOAD", name: "rec" },
          { opcode: "CALL", argc: 0 },
          { opcode: "RETURN" },
        ],
      },
    ],
  };
  expect(() => run(bytecode, { maxFrameDepth: 4, maxStackDepth: 10_000 })).toThrow(
    FrameStackOverflow,
  );
  expect(() => run(bytecode, { maxFrameDepth: 4, maxStackDepth: 4 })).toThrow(
    FrameStackOverflow,
  );
});
