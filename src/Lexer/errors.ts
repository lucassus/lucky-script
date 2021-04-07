// TODO: Rename to IllegalSymbolError
// TODO: Use SyntaxError in Parser
export class SyntaxError extends Error {
  public readonly position: number;

  constructor(symbol: string, position: number) {
    super(`Unrecognized symbol '${symbol}' at position ${position}`);
    Object.setPrototypeOf(this, SyntaxError.prototype);

    this.position = position;
  }
}
