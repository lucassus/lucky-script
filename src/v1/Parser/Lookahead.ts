export class Lookahead<T> {
  #current: T;

  #next: T;

  constructor(private readonly iterator: Iterator<T>) {
    this.#current = this.iterator.next().value as T;
    this.#next = this.iterator.next().value as T;
  }

  advance() {
    this.#current = this.#next;
    this.#next = this.iterator.next().value as T;
  }

  get current(): T {
    return this.#current;
  }

  get next(): T {
    return this.#next;
  }
}
