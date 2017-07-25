"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
    tick() {
        if (Memory.profiling) {
            Memory.profileTicks++;
        }
    }
    track(name) {
        if (!Memory.profiling) {
            return () => undefined;
        }
        const startCPU = Game.cpu.getUsed();
        return () => this.trackMethod(name, Game.cpu.getUsed() - startCPU);
    }
    trackMethod(name, consumedCPU) {
        if (!Memory.profile[name + '_call']) {
            Memory.profileMethod[name] = 1;
            Memory.profile[name + '_call'] = 0;
            Memory.profile[name + '_cpu'] = 0;
        }
        Memory.profile[name + '_call']++;
        Memory.profile[name + '_cpu'] += consumedCPU;
    }
    start() {
        Memory.profiling = true;
    }
    stop() {
        Memory.profiling = false;
    }
    reset() {
        this.stop();
        Memory.profileTicks = 0;
        Memory.profileMethod = {};
        Memory.profile = {};
    }
    print() {
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
exports.profiler = new Profiler();
function Profile(name = '') {
    return function (target, key, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = function () {
            const done = exports.profiler.track(name + '::' + key);
            const result = originalMethod.apply(this, ...arguments);
            done();
            return result;
        };
        return descriptor;
    };
}
exports.Profile = Profile;