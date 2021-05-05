import { LuckyObject } from "./LuckyObject";

export class LuckyNone extends LuckyObject {
  private constructor() {
    super();
  }

  static Instance = new LuckyNone();
}
