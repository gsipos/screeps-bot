import { Profile, profiler } from "../../telemetry/profiler";
import { sumReducer } from "../../util";

export class RollingAverageComputed {
  items: number[] = [];
  private value: number | undefined;
  private captureTime: number | undefined;
  private avg: number = 0;

  constructor(
    private dataSupplier: () => number,
    private rollingAverageWindow: number
  ) {}

  private addToWindow(newValue: number) {
    this.items.push(newValue);
    while (this.items.length > this.rollingAverageWindow) {
      this.items.shift();
    }
    this.avg = this.items.reduce(sumReducer,0) / this.items.length;
  }

  private capture() {
    if (!this.value || this.captureTime !== Game.time) {
      this.value = profiler.wrap("RollingAverageComputed::supplier", this.dataSupplier);
      this.captureTime = Game.time;
      this.addToWindow(this.value);
    }
  }

  @Profile("RollingAverage")
  public get(): number {
    this.capture();
    return this.value!;
  }

  @Profile("RollingAverage")
  public average(): number {
    this.capture();
    return this.avg!;
  }
}
