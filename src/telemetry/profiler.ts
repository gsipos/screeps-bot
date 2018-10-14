import { stats } from "./statistics";

type TrackId = number;

class Profiler {
  constructor() {
    if (!Memory.profileMethod) {
      Memory.profileMethod = {};
    }
    if (!Memory.profileTicks) {
      Memory.profileTicks = 0;
    }
  }

  public tick() {
    if (Memory.profiling) {
      Memory.profileTicks++;
    }
  }

  private noopTrackId: number = 0;
  private lastTrackId: number = 1;

  private getNewTrackId() {
    return this.lastTrackId++;
  }

  private trackStartCPUs: Record<TrackId, number> = {};
  private trackMethods: Record<TrackId, string> = {};

  public track(name: string): TrackId {
    if (!Memory.profiling) {
      return this.noopTrackId as TrackId;
    }
    const id = this.getNewTrackId();
    this.trackStartCPUs[id] = Game.cpu.getUsed();
    this.trackMethods[id] = name;
    return id;
  }

  public finish(id: TrackId | undefined) {
    if (!id) return;
    const name = this.trackMethods[id];
    const start = this.trackStartCPUs[id];
    this.trackMethod(name, Game.cpu.getUsed() - start);
    delete this.trackStartCPUs[id];
    delete this.trackMethods[id];
  }

  public wrap<T>(name: string, func: () => T): T {
    const trackId = this.track(name);
    const result = func();
    this.finish(trackId);
    return result;
  }

  public trackMethod(name: string, consumedCPU: number) {
    if (!Memory.profiling) return;
    stats.metric("Profile::" + name, consumedCPU);
  }

  public start() {
    Memory.profiling = true;
  }

  public stop() {
    Memory.profiling = false;
  }

  public reset() {
    this.stop();
    Memory.profileTicks = 0;
    Memory.profileMethod = {};
  }

  public memoryParse() {
    const stringified = JSON.stringify(Memory.pathStore);
    const startCpu = Game.cpu.getUsed();
    JSON.parse(stringified);
    const endCpu = Game.cpu.getUsed() - startCpu;

    const stringified2 = JSON.stringify(Memory.pathTreeStore);
    const startCpu2 = Game.cpu.getUsed();
    JSON.parse(stringified2);
    const endCpu2 = Game.cpu.getUsed() - startCpu2;

    console.log("CPU spent on Memory parsing:", endCpu, endCpu2);
  }

  public visualizePath(from: number, to: number) {
    Object.keys(Memory.pathStore)
      .slice(0, 1000)
      .map(k => Memory.pathStore[k])
      .map(p => Room.deserializePath(p))
      .forEach(p =>
        new RoomVisual("E64N49").poly(p as any, {
          stroke: "#fff",
          strokeWidth: 0.15,
          opacity: 0.2,
          lineStyle: "dashed"
        })
      );
  }
}

export const profiler = new Profiler();

declare var global: any;
global.Profiler = profiler;

export function Profile(name: string = "") {
  return function(
    target: any,
    key: string,
    descriptor: TypedPropertyDescriptor<any>
  ) {
    const originalMethod: Function = descriptor.value;

    descriptor.value = function() {
      const trackId = profiler.track(name + "::" + key);
      const result = originalMethod.apply(this, arguments);
      profiler.finish(trackId);
      return result;
    };

    return descriptor;
  };
}
