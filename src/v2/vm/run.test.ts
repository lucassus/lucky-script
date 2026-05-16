import { expect, test } from "vitest";

import type { BytecodeModule } from "../compiler/bytecode";
import {
  ArityMismatch,
  FrameStackOverflow,
  NotCallable,
  StackOverflow,
  StackUnderflow,
  UndefinedVariable,
} from "./errors";
import { run } from "./run";

function mainModule(code: BytecodeModule["main"]["code"]): BytecodeModule {
  return { main: { name: "__main", params: [], code }, functions: [] };
}

/** Extract the numeric result from run(); throws if the result is a closure. */
function numResult(mod: BytecodeModule): number | undefined {
  const v = run(mod);
  if (v === undefined) return undefined;
  if (v.kind !== "number") throw new Error(`expected number, got closure`);
  return v.value;
}

// ── Error cases ───────────────────────────────────────────────────────────────

test("run throws StackUnderflow when ADD has too few operands", () => {
  const mod = mainModule([{ opcode: "ADD" }]);
  expect(() => run(mod)).toThrow(StackUnderflow);
});

test("run throws StackOverflow when stack exceeds maxStackDepth", () => {
  const mod = mainModule([
    { opcode: "PUSH", value: 1 },
    { opcode: "PUSH", value: 2 },
    { opcode: "PUSH", value: 3 },
  ]);
  expect(() => run(mod, { maxStackDepth: 2 })).toThrow(StackOverflow);
});

test("run throws UndefinedVariable on LOAD of missing binding", () => {
  const mod = mainModule([{ opcode: "LOAD", name: "nope" }]);
  expect(() => run(mod)).toThrow(UndefinedVariable);
});

test("CALL throws NotCallable when callee is a number", () => {
  const mod = mainModule([
    { opcode: "PUSH", value: 42 },
    { opcode: "CALL", argc: 0 },
    { opcode: "HALT" },
  ]);
  expect(() => run(mod)).toThrow(NotCallable);
});

// ── CALL / RETURN ─────────────────────────────────────────────────────────────

test("CALL / RETURN: no-arg callee returns constant", () => {
  const mod: BytecodeModule = {
    main: {
      name: "__main",
      params: [],
      // Push the closure for k, then call it immediately.
      code: [
        { opcode: "MAKE_CLOSURE", fnIndex: 0 },
        { opcode: "CALL", argc: 0 },
        { opcode: "HALT" },
      ],
    },
    functions: [
      {
        name: "k",
        params: [],
        code: [{ opcode: "PUSH", value: 42 }, { opcode: "RETURN" }],
      },
    ],
  };
  expect(numResult(mod)).toBe(42);
});

test("CALL / RETURN: single-arg callee doubles via LOAD", () => {
  const mod: BytecodeModule = {
    main: {
      name: "__main",
      params: [],
      code: [
        { opcode: "MAKE_CLOSURE", fnIndex: 0 },
        { opcode: "PUSH", value: 7 },
        { opcode: "CALL", argc: 1 },
        { opcode: "HALT" },
      ],
    },
    functions: [
      {
        name: "double",
        params: ["x"],
        code: [
          { opcode: "LOAD", name: "x" },
          { opcode: "PUSH", value: 2 },
          { opcode: "MUL" },
          { opcode: "RETURN" },
        ],
      },
    ],
  };
  expect(numResult(mod)).toBe(14);
});

test("CALL / RETURN: recursion counts down to zero", () => {
  // Main binds "count" in the global env before calling it so that the
  // recursive LOAD "count" inside the function body can find itself.
  const mod: BytecodeModule = {
    main: {
      name: "__main",
      params: [],
      code: [
        { opcode: "MAKE_CLOSURE", fnIndex: 0 },
        { opcode: "DEFINE", name: "count" },
        { opcode: "LOAD", name: "count" },
        { opcode: "PUSH", value: 3 },
        { opcode: "CALL", argc: 1 },
        { opcode: "HALT" },
      ],
    },
    functions: [
      {
        name: "count",
        params: ["n"],
        code: [
          { opcode: "LOAD", name: "n" }, // 0
          { opcode: "JMP_IF_ZERO", target: 8 }, // 1
          { opcode: "LOAD", name: "count" }, // 2 — load self via env chain
          { opcode: "LOAD", name: "n" }, // 3
          { opcode: "PUSH", value: 1 }, // 4
          { opcode: "SUB" }, // 5
          { opcode: "CALL", argc: 1 }, // 6
          { opcode: "RETURN" }, // 7
          { opcode: "PUSH", value: 0 }, // 8
          { opcode: "RETURN" }, // 9
        ],
      },
    ],
  };
  expect(numResult(mod)).toBe(0);
});

// ── DEFINE / ASSIGN ───────────────────────────────────────────────────────────

test("DEFINE then LOAD round-trips inside a callee", () => {
  const mod: BytecodeModule = {
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
        name: "f",
        params: [],
        code: [
          { opcode: "PUSH", value: 99 },
          { opcode: "DEFINE", name: "x" },
          { opcode: "LOAD", name: "x" },
          { opcode: "RETURN" },
        ],
      },
    ],
  };
  expect(numResult(mod)).toBe(99);
});

test("nested CALL: DEFINE in inner does not affect outer's binding", () => {
  // outer defines x=1, calls inner which defines its OWN x=99, then outer
  // reads its x and expects to still see 1 (DEFINE is always current scope).
  const mod: BytecodeModule = {
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
        name: "outer",
        params: [],
        code: [
          { opcode: "PUSH", value: 1 },
          { opcode: "DEFINE", name: "x" },
          { opcode: "MAKE_CLOSURE", fnIndex: 1 },
          { opcode: "CALL", argc: 0 },
          { opcode: "LOAD", name: "x" },
          { opcode: "RETURN" },
        ],
      },
      {
        name: "inner",
        params: [],
        code: [
          { opcode: "PUSH", value: 99 },
          { opcode: "DEFINE", name: "x" },
          { opcode: "PUSH", value: 0 },
          { opcode: "RETURN" },
        ],
      },
    ],
  };
  expect(numResult(mod)).toBe(1);
});

// ── Frame depth limits ────────────────────────────────────────────────────────

test("FrameStackOverflow when frame depth cap exceeded", () => {
  const mod: BytecodeModule = {
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
  expect(() => run(mod, { maxFrameDepth: 4 })).toThrow(FrameStackOverflow);
});

test("maxStackDepth and maxFrameDepth are independent", () => {
  const mod: BytecodeModule = {
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
  expect(() => run(mod, { maxFrameDepth: 4, maxStackDepth: 10_000 })).toThrow(
    FrameStackOverflow,
  );
  expect(() => run(mod, { maxFrameDepth: 4, maxStackDepth: 4 })).toThrow(
    FrameStackOverflow,
  );
});

test("CALL throws ArityMismatch on wrong argument count", () => {
  const mod: BytecodeModule = {
    main: {
      name: "__main",
      params: [],
      code: [
        { opcode: "MAKE_CLOSURE", fnIndex: 0 },
        { opcode: "CALL", argc: 0 }, // expects 1 arg, got 0
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
  expect(() => run(mod)).toThrow(ArityMismatch);
});
