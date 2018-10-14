export class Lazy<T> {
  private value: T | undefined;

  constructor(private supplier: () => T) {}

  public get(): T {
    if (!this.value) {
      this.value = this.supplier();
    }
    return this.value;
  }

  public clear() {
    this.value = undefined;
  }
}
