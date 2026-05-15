import type { BytecodeModule } from "./bytecode";
import type { Instruction } from "./opcodes";

function formatInstruction(
  module: BytecodeModule,
  fnIndex: number,
  ip: number,
  instr: Instruction,
): string {
  const prefix = `[${fnIndex}:${ip}]`;
  switch (instr.op) {
    case "CONST": {
      const value = module.constants[instr.index];
      return `${prefix} CONST ${instr.index} ; ${String(value)}`;
    }
    case "LOAD_G":
      return `${prefix} LOAD_G ${instr.slot} ; ${module.globals[instr.slot] ?? "?"}`;
    case "STORE_G":
      return `${prefix} STORE_G ${instr.slot} ; ${module.globals[instr.slot] ?? "?"}`;
    case "LOAD_L": {
      const proto = module.functions[fnIndex];
      const name = proto?.localNames[instr.slot];
      return `${prefix} LOAD_L ${instr.slot}${name !== undefined ? ` ; ${name}` : ""}`;
    }
    case "STORE_L": {
      const proto = module.functions[fnIndex];
      const name = proto?.localNames[instr.slot];
      return `${prefix} STORE_L ${instr.slot}${name !== undefined ? ` ; ${name}` : ""}`;
    }
    case "ADD":
      return `${prefix} ADD`;
    case "SUB":
      return `${prefix} SUB`;
    case "MUL":
      return `${prefix} MUL`;
    case "DIV":
      return `${prefix} DIV`;
    case "LT":
      return `${prefix} LT`;
    case "EQ":
      return `${prefix} EQ`;
    case "JUMP":
      return `${prefix} JUMP -> ${instr.target}`;
    case "JUMP_IF_ZERO":
      return `${prefix} JUMP_IF_ZERO -> ${instr.target}`;
    case "CALL": {
      const callee = module.functions[instr.fn];
      const calleeName = callee?.name ?? "?";
      return `${prefix} CALL fn=${instr.fn}(${calleeName}) argc=${instr.argc}`;
    }
    case "RETURN":
      return `${prefix} RETURN`;
    case "POP":
      return `${prefix} POP`;
    default: {
      const _exhaustive: never = instr;
      return `${prefix} ${_exhaustive}`;
    }
  }
}

export function disassemble(module: BytecodeModule): string {
  const lines: string[] = [];
  lines.push(
    `constants: ${module.constants.map((n) => String(n)).join(", ")}`,
    `globals: ${module.globals.join(", ")}`,
    `entry: ${module.entry}`,
    "",
  );

  for (let fi = 0; fi < module.functions.length; fi++) {
    const fn = module.functions[fi]!;
    lines.push(
      `fn ${fi}: ${fn.name} arity=${fn.arity} locals=${fn.localCount}`,
    );
    for (let ip = 0; ip < fn.code.length; ip++) {
      lines.push(formatInstruction(module, fi, ip, fn.code[ip]!));
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}
