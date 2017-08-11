"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const creep_1 = require("./creep");
const data_1 = require("./data");
const profiler_1 = require("./profiler");
const sumCreepEnergy = (creeps) => creeps.map(c => c.carry.energy || 0).reduce((a, b) => a + b, 0);
const energy = new creep_1.CreepJob('energy', '#ffaa00', 'energy', (c, t) => c.withdraw(t, RESOURCE_ENERGY), (c, t) => (c.carry.energy || 0) > 0 || t.store[RESOURCE_ENERGY] === 0, c => data_1.data.of(c.room).containerOrStorage.get().filter((s) => s.store[RESOURCE_ENERGY] > c.carryCapacity), creep_1.TargetSelectionPolicy.distance);
const fillSpawnOrExtension = new creep_1.CreepJob('fillSpawn', '#ffffff', 'fill:spawn', (c, t) => c.transfer(t, RESOURCE_ENERGY), (c, t) => c.carry.energy == 0 || t.energy == t.energyCapacity, c => data_1.data.of(c.room).extensionOrSpawns.get(), creep_1.TargetSelectionPolicy.distance, (ac, t) => t.energyCapacity - t.energy < sumCreepEnergy(ac));
const fillTower = new creep_1.CreepJob('fillTower', '#ffffff', 'fill:tower', (c, t) => c.transfer(t, RESOURCE_ENERGY), (c, t) => c.carry.energy === 0 || t.energy === t.energyCapacity, c => data_1.data.of(c.room).towers.get(), creep_1.TargetSelectionPolicy.distance, (ac, t) => (t.energyCapacity - t.energy) < sumCreepEnergy(ac));
const fillCreeps = new creep_1.CreepJob('fillCreep', '#ee00aa', 'fill:creep', (c, t) => c.transfer(t, RESOURCE_ENERGY), (c, t) => !!t && (c.carry.energy === 0 || (t.carry.energy || 0) > 0), c => data_1.data.of(c.room).fillableCreeps.get(), creep_1.TargetSelectionPolicy.distance, (ac, t) => t.carryCapacity - (t.carry.energy || 0) < sumCreepEnergy(ac));
const fillStorage = new creep_1.CreepJob('fillStorage', 'af1277', 'fill:storage', (c, t) => c.transfer(t, RESOURCE_ENERGY, (c.carry.energy || 0) - c.carryCapacity * 0.5), (c, t) => !!t && ((c.carry.energy || 0) <= c.carryCapacity * 0.5 || t.storeCapacity === t.store.energy), c => c.room.storage ? [c.room.storage] : [], creep_1.TargetSelectionPolicy.inOrder);
const idleFill = new creep_1.CreepJob('idlefill', '#ffaa00', 'idle', (c, t) => c.withdraw(t, RESOURCE_ENERGY), (c, t) => (c.carry.energy || 0) > (c.carryCapacity * 0.5) || t.store[RESOURCE_ENERGY] === 0, c => data_1.data.of(c.room).containers.get().filter(s => s.store[RESOURCE_ENERGY] > 0), targets => targets.sort((a, b) => b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY]));
class CarryCreepManager {
    constructor() {
        this.carryJobs = [
            energy,
            fillSpawnOrExtension,
            fillTower,
            fillCreeps,
            fillStorage,
            idleFill
        ];
    }
    loop() {
        data_1.data.carryCreeps.get()
            .forEach(creep => creep_1.creepManager.processCreep(creep, this.carryJobs));
    }
}
__decorate([
    profiler_1.Profile('Carry')
], CarryCreepManager.prototype, "loop", null);
exports.carryCreepManager = new CarryCreepManager();
