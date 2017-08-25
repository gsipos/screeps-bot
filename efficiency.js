"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const data_1 = require("./data");
const statistics_1 = require("./statistics");
const profiler_1 = require("./profiler");
const util_1 = require("./util");
class Efficiency {
    loop() {
        if (Game.cpu.bucket < 5000)
            return;
        util_1.forEachRoom(room => {
            this.containerUsage(room);
            this.carryCreepUtilization(room);
            this.sourceMining(room);
        });
    }
    containerUsage(room) {
        data_1.data.of(room).containers.get()
            .map(container => (container.store.energy || 0) / container.storeCapacity)
            .forEach(usage => statistics_1.stats.metric(`Efficiency::${room.name}::container`, usage));
    }
    carryCreepUtilization(room) {
        data_1.data.of(room).carryCreeps.get()
            .map(carry => (carry.carry.energy || 0) / carry.carryCapacity)
            .forEach(utilization => statistics_1.stats.metric(`Efficiency::${room.name}::carry`, utilization));
    }
    sourceMining(room) {
        data_1.data.of(room).sources.get()
            .map(s => s.energy / s.energyCapacity)
            .forEach(unMined => statistics_1.stats.metric(`Efficiency::${room.name}::source`, unMined));
    }
}
__decorate([
    profiler_1.Profile('Efficiency')
], Efficiency.prototype, "loop", null);
exports.Efficiency = Efficiency;
exports.efficiency = new Efficiency();
