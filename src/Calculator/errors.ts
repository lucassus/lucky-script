import { Token } from "./Token";
import { TokenType } from "./TokenType";

export abstract class SyntaxError extends Error {
  protected constructor(message: string, public position: number) {
    super(message);
  }
}

export class IllegalCharacterError extends SyntaxError {
  constructor(character: string, position: number) {
    super(`Unrecognized character '${character}' at ${position}`, position);
  }
}

export class IllegalTokenError extends SyntaxError {
  constructor(currentToken: Token, expectedType?: TokenType) {
    super(
      expectedType
        ? `Expected '${expectedType}' but got '${currentToken.type}' at position ${currentToken.position}`
        : `Unexpected '${currentToken.type}' at position ${currentToken.position}`,
      currentToken.position
    );
  }
}

class RuntimeError extends Error {}

export class UndefinedVariableError extends RuntimeError {
  constructor(name: string) {
    super(`Variable ${name} is not defined`);
  }
}

export class ZeroDivisionError extends RuntimeError {
  constructor() {
    super("Division by zero");
  }
}
