import { Recognizer } from "./Recognizer";
import { Case } from "./state/Case";
import { State } from "./state/State";

const beginComment = new Case(0, false);

const comment: State = {
  name: 1,
  isFinal: true,

  next(symbol: undefined | string) {
    if (["\n", undefined].includes(symbol)) {
      return undefined;
    }

    return this;
  },
};

beginComment.on("#").switchTo(comment);

export class CommentRecognizer extends Recognizer {
  constructor() {
    super(beginComment);
  }
}
