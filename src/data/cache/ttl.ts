export class TTL<T> {
  public static hit = 0;
  public static miss = 0;

  private value: T | undefined;
  private maxAge: number = Game.time - 1;

  constructor(private ttl: number, private supplier: () => T) {}

  public get(): T {
    if (this.emptyValue || this.old || this.arrayValueHasNullOrUndefinedItem) {
      try {
        this.value = this.supplier();
      } catch (e) {
        console.log("Caught in TTL", e);
      }
      this.maxAge = Game.time + this.ttl;
      TTL.miss++;
    } else {
      TTL.hit++;
    }
    return this.value as T;
  }

  private get emptyValue() {
    return this.value === null || this.value === undefined;
  }

  private get arrayValueHasNullOrUndefinedItem(): boolean {
    if (this.value instanceof Array) {
      return this.value.some(item => item === null || item === undefined);
    } else {
      return false;
    }
  }

  private get old() {
    return Game.time > this.maxAge;
  }

  public clear() {
    this.value = undefined;
  }
}
