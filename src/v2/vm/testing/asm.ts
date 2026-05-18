import type { Instruction } from "../../compiler/bytecode";

type LabelToken = { kind: "label"; name: string };
type JumpToken = { kind: "jump"; opcode: "JMP" | "JMP_IF_ZERO"; label: string };

export type AsmToken = Instruction | LabelToken | JumpToken;

/** Mark a symbolic jump target in ASM-like test snippets. */
export function label(name: string): LabelToken {
  return { kind: "label", name };
}

/** Unconditional jump to a symbolic label. */
export function jmp(name: string): JumpToken {
  return { kind: "jump", opcode: "JMP", label: name };
}

/** Conditional jump-if-zero to a symbolic label. */
export function jumpIfZero(name: string): JumpToken {
  return { kind: "jump", opcode: "JMP_IF_ZERO", label: name };
}

/**
 * Assemble a compact VM test program with symbolic labels into raw bytecode.
 * Keeps unit tests readable while still exercising the VM directly.
 */
export function asm(tokens: readonly AsmToken[]): Instruction[] {
  const labels = new Map<string, number>();
  let ip = 0;

  for (const token of tokens) {
    if (!("kind" in token)) {
      ip++;
      continue;
    }

    if (token.kind === "label") {
      if (labels.has(token.name)) {
        throw new Error(`duplicate label: ${token.name}`);
      }
      labels.set(token.name, ip);
      continue;
    }

    ip++;
  }

  const code: Instruction[] = [];
  for (const token of tokens) {
    if (!("kind" in token)) {
      code.push(token);
      continue;
    }

    if (token.kind === "label") {
      continue;
    }

    const target = labels.get(token.label);
    if (target === undefined) {
      throw new Error(`unknown label: ${token.label}`);
    }
    code.push({ opcode: token.opcode, target });
  }

  return code;
}
