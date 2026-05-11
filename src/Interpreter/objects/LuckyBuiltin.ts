import { LuckyBoolean } from "./LuckyBoolean";
import { LuckyObject } from "./LuckyObject";

type NativeFn = (args: LuckyObject[]) => LuckyObject;

export class LuckyBuiltin extends LuckyObject {
  constructor(
    public readonly name: string,
    public readonly arity: number,
    private readonly fn: NativeFn,
  ) {
    super();
  }

  call(args: LuckyObject[]): LuckyObject {
    return this.fn(args);
  }

  display(): string {
    return `<builtin ${this.name}>`;
  }

  typeName(): string {
    return "function";
  }

  toBoolean(): LuckyBoolean {
    return LuckyBoolean.True;
  }
}
