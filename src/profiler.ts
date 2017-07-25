class Profiler {

  constructor() {
    if (!Memory.profileMethod) {
      Memory.profileMethod = {};
    }
    if (!Memory.profile) {
      Memory.profile = {};
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

  public trackMethod(name: string, consumedCPU: number) {
    if (!Memory.profile[name + '_call']) {
      Memory.profileMethod[name] = 1;
      Memory.profile[name + '_call'] = 0;
      Memory.profile[name + '_cpu'] = 0;
    }
    Memory.profile[name + '_call']++;
    Memory.profile[name + '_cpu'] += consumedCPU;
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
    Memory.profile = {};
  }

  public print() {
    const entries = Object.keys(Memory.profileMethod).map(name => ({
      name: name,
      calls: Memory.profile[name + '_call'],
      cpu: Memory.profile[name + '_cpu']
    }));
    console.log('----------------------------------------------');
    console.log('| Name | Total Calls | Total CPU | Avg. Cpu | Avg Calls/Tick');
    entries.forEach(e => console.log(`| ${e.name} | ${e.calls} | ${e.cpu} | ${e.cpu / e.calls} | ${e.calls / Memory.profileTicks}`));
    console.log('----------------------------------------------');
  }
}

export const profiler = new Profiler();

export function Profile(name: string='') {
  return function (target: any, key: string, descriptor: TypedPropertyDescriptor<any>) {
    const originalMethod = descriptor.value;

    descriptor.value = function () {
      const done = profiler.track(name+'::'+key);
      const result = originalMethod.apply(this, ...arguments);
      done();
      return result;
    }

    return descriptor;
  };
}
