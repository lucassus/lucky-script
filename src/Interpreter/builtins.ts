import { LuckyBoolean } from "./objects/LuckyBoolean";
import { LuckyBuiltin } from "./objects/LuckyBuiltin";
import { LuckyFunction } from "./objects/LuckyFunction";
import { LuckyNothing } from "./objects/LuckyNothing";
import { LuckyNumber } from "./objects/LuckyNumber";
import { LuckyObject } from "./objects";
import { LuckyString } from "./objects/LuckyString";

function typeName(arg: LuckyObject): string {
  if (arg instanceof LuckyNumber) return "number";
  if (arg instanceof LuckyString) return "string";
  if (arg instanceof LuckyBoolean) return "boolean";
  if (arg instanceof LuckyNothing) return "nothing";
  if (arg instanceof LuckyFunction || arg instanceof LuckyBuiltin)
    return "function";
  /* c8 ignore next */
  return "unknown";
}

export const BUILTINS: Record<string, LuckyBuiltin> = {
  print: new LuckyBuiltin("print", 1, ([arg]) => {
    console.log(arg.display());
    return LuckyNothing.Instance;
  }),
  type: new LuckyBuiltin("type", 1, ([arg]) => {
    return new LuckyString(typeName(arg));
  }),
};
