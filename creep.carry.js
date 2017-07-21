"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const creep_1 = require("./creep");
const data_1 = require("./data");
const energy = new creep_1.CreepJob('energy', '#ffaa00', 'energy', (c, t) => c.withdraw(t, RESOURCE_ENERGY), (c, t) => (c.carry.energy || 0) > 0 || t.store[RESOURCE_ENERGY] === 0, c => data_1.data.roomContainerOrStorage(c.room).filter((s) => s.store[RESOURCE_ENERGY] > 0), targets => targets.sort((a, b) => b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY]));
const fillSpawnOrExtension = new creep_1.CreepJob('fillSpawn', '#ffffff', 'fill:spawn', (c, t) => c.transfer(t, RESOURCE_ENERGY), (c, t) => c.carry.energy == 0 || t.energy == t.energyCapacity, c => data_1.data.roomExtensionOrSpawn(c.room), creep_1.TargetSelectionPolicy.distance);
const fillTower = new creep_1.CreepJob('fillTower', '#ffffff', 'fill:tower', (c, t) => c.transfer(t, RESOURCE_ENERGY), (c, t) => c.carry.energy === 0 || t.energy === t.energyCapacity, c => data_1.data.roomTower(c.room), creep_1.TargetSelectionPolicy.distance);
const fillCreeps = new creep_1.CreepJob('fillCreep', '#ee00aa', 'fill:creep', (c, t) => c.transfer(t, RESOURCE_ENERGY), (c, t) => !!t && (c.carry.energy === 0 || (t.carry.energy || 0) > 0), c => data_1.data.roomCreeps(c.room)
    .filter(creep => creep.memory.role !== 'miner')
    .filter(creep => creep.memory.role !== 'carry'), creep_1.TargetSelectionPolicy.distance);
class CarryCreepManager {
    constructor() {
        this.carryJobs = [
            energy,
            fillTower,
            fillSpawnOrExtension,
            fillCreeps
        ];
    }
    loop() {
        data_1.data.creepByRole('carry')
            .forEach(creep => creep_1.creepManager.processCreep(creep, this.carryJobs));
    }
}
exports.carryCreepManager = new CarryCreepManager();
