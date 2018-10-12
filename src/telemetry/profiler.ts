import { stats } from './statistics';
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

  public track(name: string): () => void {
    if (!Memory.profiling) {
      return () => undefined;
    }
    const startCPU = Game.cpu.getUsed();
    return () => this.trackMethod(name, Game.cpu.getUsed() - startCPU);
  }

  public wrap<T>(name: string, func: () => T): T {
    const done = this.track(name);
    const result = func();
    done();
    return result;
  }

  public trackMethod(name: string, consumedCPU: number) {
    if (!Memory.profiling) {
      return;
    }
    stats.metric('Profile::'+name, consumedCPU);
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

    console.log('CPU spent on Memory parsing:', endCpu, endCpu2);
  }

  public visualizePath(from: number, to: number) {
    Object.keys(Memory.pathStore)
      .slice(0, 1000)
      .map(k => Memory.pathStore[k])
      .map(p => Room.deserializePath(p))
      .forEach(p => new RoomVisual('E64N49')
        .poly(p as any, { stroke: '#fff', strokeWidth: .15, opacity: .2, lineStyle: 'dashed' }));
  }
}

export const profiler = new Profiler();

declare var global: any;
global.Profiler = profiler;

export function Profile(name: string='') {
  return function (target: any, key: string, descriptor: TypedPropertyDescriptor<any>) {
    const originalMethod: Function = descriptor.value;

    descriptor.value = function () {
      const done = profiler.track(name+'::'+key);
      const result = originalMethod.apply(this, arguments);
      done();
      return result;
    }

    return descriptor;
  };
}
