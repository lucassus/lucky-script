import { compile } from "./compiler";
import { parse } from "./parser";
import { run as runBytecode, type RunOptions } from "./vm";

export function run(code: string, options?: RunOptions): undefined | number {
  const program = parse(code);
  const bytecode = compile(program);
  const result = runBytecode(bytecode, options);

  return result?.kind === "number" ? result.value : undefined;
}
