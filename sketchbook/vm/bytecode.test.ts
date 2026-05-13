import { describe, expect, test } from "vitest";

import {
  allocateGlobalSlot,
  appendFunctionProto,
  createBytecodeModule,
  createFunctionProto,
  pushConstant,
} from "./bytecode";
import { disassemble } from "./disasm";
import type { Instruction } from "./opcodes";

describe("bytecode / disasm", () => {
  test("module shape and disassembly for hand-written sample", () => {
    const module = createBytecodeModule();
    const i0 = pushConstant(module, 1);
    const i1 = pushConstant(module, 2);
    expect(i0).toBe(0);
    expect(i1).toBe(1);

    allocateGlobalSlot(module, "x");

    const main = createFunctionProto("__main", 0);
    main.localCount = 0;
    const code: Instruction[] = [
      { op: "CONST", index: i0 },
      { op: "CONST", index: i1 },
      { op: "ADD" },
      { op: "RETURN" },
    ];
    main.code = code;
    appendFunctionProto(module, main);

    expect(module.constants).toEqual([1, 2]);
    expect(module.globals).toEqual(["x"]);
    expect(module.functions).toHaveLength(1);
    expect(module.entry).toBe(0);

    const text = disassemble(module);
    expect(text).toContain("constants: 1, 2");
    expect(text).toContain("globals: x");
    expect(text).toContain("[0:0] CONST 0 ; 1");
    expect(text).toContain("[0:1] CONST 1 ; 2");
    expect(text).toContain("[0:2] ADD");
    expect(text).toContain("[0:3] RETURN");
  });
});
