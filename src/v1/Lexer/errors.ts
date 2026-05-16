export class IllegalSymbolError extends Error {
  public readonly position: number;

  constructor(symbol: string, position: number) {
    super(`Unrecognized symbol '${symbol}' at position ${position}`);
    Object.setPrototypeOf(this, IllegalSymbolError.prototype);

    this.position = position;
  }
}
