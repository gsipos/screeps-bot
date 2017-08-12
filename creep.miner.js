"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const creep_1 = require("./creep");
const profiler_1 = require("./profiler");
const data_1 = require("./data");
const moveToContainer = new creep_1.CreepJob('moveToContainer', 'ffaa00', 'toContainer', (c, t) => ERR_NOT_IN_RANGE, (c, t) => c.pos.isEqualTo(t.pos), c => [Game.getObjectById(c.memory.container)], creep_1.TargetSelectionPolicy.inOrder);
const harvestForContainerBuild = new creep_1.CreepJob('harvestToBuild', 'ffaa00', 'harvest', (c, t) => c.harvest(t), (c, t) => {
    const container = Game.getObjectById(c.memory.container);
    const nonConstruction = !(container instanceof ConstructionSite);
    const needRepair = container.hits < container.hitsMax;
    const creepFull = c.carry.energy === c.carryCapacity;
    return (nonConstruction && !needRepair) || creepFull;
}, c => [Game.getObjectById(c.memory.source)], creep_1.TargetSelectionPolicy.inOrder);
const buildContainer = new creep_1.CreepJob('buildContainer', 'ffaa00', 'build', (c, t) => c.build(t), (c, t) => !(t instanceof ConstructionSite) || !c.carry.energy, c => [Game.getObjectById(c.memory.container)], creep_1.TargetSelectionPolicy.inOrder);
const repairContainer = new creep_1.CreepJob('repairContainer', 'ffaa00', 'repair', (c, t) => c.repair(t), (c, t) => t.hits === t.hitsMax, c => [Game.getObjectById(c.memory.container)], creep_1.TargetSelectionPolicy.inOrder);
const mine = new creep_1.CreepJob('mine', '#aaaaaa', 'mine', (c, t) => {
    c.harvest(t);
    return c.transfer(Game.getObjectById(c.memory.container), RESOURCE_ENERGY);
}, (c, t) => {
    const container = Game.getObjectById(c.memory.container);
    const containerNeedsRepair = container.hits < container.hitsMax;
    const containerFull = container.store.energy === container.storeCapacity;
    return containerNeedsRepair || containerFull || t.energy === 0;
}, c => [Game.getObjectById(c.memory.source)], creep_1.TargetSelectionPolicy.inOrder);
const waiting = new creep_1.CreepJob('wait', '#aaaaaa', 'wait', c => 0, (c, t) => t.energy > 0, c => [Game.getObjectById(c.memory.source)], creep_1.TargetSelectionPolicy.inOrder);
class MinerCreepManager {
    constructor() {
        this.minerJobs = [
            moveToContainer,
            harvestForContainerBuild,
            buildContainer,
            repairContainer,
            mine,
            waiting
        ];
    }
    loop() {
        const minerCreeps = data_1.data.minerCreeps.get().filter(c => !c.spawning);
        minerCreeps.forEach(miner => {
            if (!miner.memory.source || !Game.getObjectById(miner.memory.container)) {
                this.chooseMiningPosition(miner, minerCreeps);
            }
            creep_1.creepManager.processCreep(miner, this.minerJobs);
        });
    }
    chooseMiningPosition(creep, minerCreeps) {
        const roomData = data_1.data.of(creep.room);
        const occupiedContainers = minerCreeps.map(c => c.memory.container);
        const containers = roomData.containers.get();
        const freeContainers = containers.filter(c => !occupiedContainers.includes(c.id));
        let container;
        if (freeContainers.length) {
            container = freeContainers[0];
        }
        else {
            const containerConstructions = roomData.containerConstructions.get();
            const freeConstructions = containerConstructions.filter(c => !occupiedContainers.includes(c.id));
            container = freeConstructions[0];
        }
        if (container) {
            console.log(creep.name, container.id);
            const flag = roomData.miningFlags.get().filter(f => f.pos.isEqualTo(container.pos))[0];
            creep.memory.container = container.id;
            creep.memory.source = flag.memory.source;
        }
        else {
            console.log('WARN: no container found for mining position');
        }
    }
}
__decorate([
    profiler_1.Profile('Miner')
], MinerCreepManager.prototype, "loop", null);
exports.minerCreepManager = new MinerCreepManager;
