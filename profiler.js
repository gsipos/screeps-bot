"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_1 = require("./data");
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
        if (!Memory.profiling) {
            return;
        }
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
        entries.forEach(e => console.log(`| ${e.name} | ${e.calls} | ${e.cpu.toFixed(2)} | ${(e.cpu / e.calls).toFixed(2)} | ${(e.calls / Memory.profileTicks).toFixed(2)}`));
        console.log('----------------------------------------------');
        console.log(`Data       hit / miss: ${data_1.data.storeHit} / ${data_1.data.storeMiss} | Hit ratio: ${(data_1.data.storeHit / (data_1.data.storeHit + data_1.data.storeMiss)).toFixed(2)}`);
        console.log(`CachedData hit / miss: ${data_1.cachedData.storeHit} / ${data_1.cachedData.storeMiss} | Hit ratio: ${(data_1.cachedData.storeHit / (data_1.cachedData.storeHit + data_1.cachedData.storeMiss)).toFixed(2)}`);
        console.log(`PathStore  hit / miss / renewed: ${data_1.pathStore.storeHit} / ${data_1.pathStore.storeMiss} / ${data_1.pathStore.renewed} | Hit ratio: ${(data_1.pathStore.storeHit / (data_1.pathStore.storeHit + data_1.pathStore.storeMiss)).toFixed(2)}`);
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
