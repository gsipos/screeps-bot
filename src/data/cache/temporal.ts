import { Profile, profiler } from "../../telemetry/profiler";

export class Temporal<T> {
  private value: T | undefined;
  private captureTime: number | undefined;

  constructor(private supplier: () => T) {}

  @Profile("Temporal")
  public get(): T {
    if (!this.value || this.captureTime !== Game.time) {
      this.value = profiler.wrap("Temporal::supplier", this.supplier);
      this.captureTime = Game.time;
    }
    return this.value;
  }

  public clear() {
    this.value = undefined;
  }

  public set(value: T) {
    this.value = value;
    this.captureTime = Game.time;
  }
}

export type DataSupplier = Record<string, () => any>;
export type TemporalizedSupplier<D extends DataSupplier> = {
  [T in keyof D]: Temporal<ReturnType<D[T]>>;
}

export function temporalize<D extends DataSupplier>(dataSupplier: D): TemporalizedSupplier<D> {
  return Object.keys(dataSupplier).reduce((supplier, key: keyof D) => {
    supplier[key] = new Temporal(dataSupplier[key]);
    return supplier;
  }, {} as TemporalizedSupplier<D>);
}
