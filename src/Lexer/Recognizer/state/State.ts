/* c8 ignore file */
export interface State {
  name: number;
  isFinal: boolean;

  next(symbol: string): undefined | State;
}
