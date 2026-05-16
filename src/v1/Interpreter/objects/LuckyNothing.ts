import { LuckyBoolean } from "./LuckyBoolean";
import { LuckyObject } from "./LuckyObject";

export class LuckyNothing extends LuckyObject {
  static Instance = new LuckyNothing();

  private constructor() {
    super();
  }

  eq(object: LuckyObject): LuckyBoolean {
    return LuckyBoolean.fromNative(object instanceof LuckyNothing);
  }

  toBoolean(): LuckyBoolean {
    return LuckyBoolean.False;
  }

  display(): string {
    return "nothing";
  }

  typeName(): string {
    return "nothing";
  }
}
