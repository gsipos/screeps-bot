export class MemoryStore<T = string> {
  constructor(private store: string) {
    if (!Memory[store]) {
      Memory[store] = {};
    }
  }

  public has(key: string): boolean {
    return !!Memory[this.store][key];
  }

  public get(key: string): T {
    return Memory[this.store][key];
  }

  public set(key: string, value: T) {
    Memory[this.store][key] = value;
  }

  public delete(key: string) {
    if (Memory[this.store]) {
      Memory[this.store][key] = undefined;
    }
  }
}
