import { MemoryStore } from "../memory/memory-store";
import { Temporal } from "./temporal";
import { notNullOrUndefined } from "../../util";

interface TTLMemoryItem {
  maxAge: number;
  content: string;
}

export class TTL<T> {
  private store = new MemoryStore<TTLMemoryItem>("ttlItems");

  private parsedValue = new Temporal<T>(() =>
    this.parse(this.storedItem.content)
  );

  constructor(
    private name: string,
    private ttl: number,
    private supplier: () => T,
    private serialize = JSON.stringify,
    private parse = JSON.parse
  ) {}

  public get(): T {
    if (this.old || this.emptyValue) {
      return this.aquireNewValue() as T;
    }
    return this.parsedValue.get();
  }

  private aquireNewValue() {
    let value = this.supplier();
    this.storeValue(value);
    return value;
  }

  private storeValue(value: T | undefined) {
    if (notNullOrUndefined(value)) {
      const maxAge = Game.time + this.ttl;
      this.store.set(this.name, { maxAge, content: this.serialize(value) });
    } else {
      this.store.delete(this.name);
    }
  }

  private get emptyValue() {
    return !this.storedItem || !this.storedItem.content;
  }

  private get storedItem() {
    return this.store.get(this.name);
  }

  private get old() {
    return this.storedItem ? Game.time > this.storedItem.maxAge : true;
  }

  public clear() {
    this.store.delete(this.name);
  }
}
