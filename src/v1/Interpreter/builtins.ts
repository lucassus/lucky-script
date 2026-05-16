import { LuckyBuiltin } from "./objects/LuckyBuiltin";
import { LuckyNothing } from "./objects/LuckyNothing";
import { LuckyString } from "./objects/LuckyString";

export const BUILTINS: Record<string, LuckyBuiltin> = {
  print: new LuckyBuiltin("print", 1, (args) => {
    const arg = args[0]!;
    console.log(arg.display());
    return LuckyNothing.Instance;
  }),
  type: new LuckyBuiltin("type", 1, (args) => {
    return new LuckyString(args[0]!.typeName());
  }),
};
