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
}
