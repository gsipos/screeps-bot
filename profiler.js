"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const statistics_1 = require("./statistics");
class Profiler {
    constructor() {
        if (!Memory.profileMethod) {
            Memory.profileMethod = {};
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
    wrap(name, func) {
        const done = this.track(name);
        const result = func();
        done();
        return result;
    }
    trackMethod(name, consumedCPU) {
        if (!Memory.profiling) {
            return;
        }
        statistics_1.stats.metric(name, consumedCPU);
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
    }
    memoryParse() {
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
    visualizePath(from, to) {
        Object.keys(Memory.pathStore)
            .slice(0, 1000)
            .map(k => Memory.pathStore[k])
            .map(p => Room.deserializePath(p))
            .forEach(p => new RoomVisual('E64N49')
            .poly(p, { stroke: '#fff', strokeWidth: .15, opacity: .2, lineStyle: 'dashed' }));
    }
}
exports.profiler = new Profiler();
global.Profiler = exports.profiler;
function Profile(name = '') {
    return function (target, key, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = function () {
            const done = exports.profiler.track(name + '::' + key);
            const result = originalMethod.apply(this, arguments);
            done();
            return result;
        };
        return descriptor;
    };
}
exports.Profile = Profile;
