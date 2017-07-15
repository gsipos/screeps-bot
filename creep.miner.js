"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const creep_1 = require("./creep");
const room_1 = require("./room");
const util_1 = require("./util");
const moveToContainer = new creep_1.CreepJob('moveToContainer', 'ffaa00', 'toContainer', (c, t) => c.moveTo(t), (c, t) => c.pos.isEqualTo(t.pos), c => [Game.getObjectById(c.memory.container)], creep_1.TargetSelectionPolicy.inOrder);
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
}, c => {
    const container = Game.getObjectById(c.memory.container);
    return container.hits < container.hitsMax;
}, c => [Game.getObjectById(c.memory.source)], creep_1.TargetSelectionPolicy.inOrder);
class MinerCreepManager {
    constructor() {
        this.minerJobs = [
            moveToContainer,
            harvestForContainerBuild,
            buildContainer,
            repairContainer,
            mine
        ];
    }
    loop() {
        const minerCreeps = Object
            .keys(Game.creeps)
            .map(n => Game.creeps[n])
            .filter(c => !c.spawning)
            .filter(c => c.memory.role === 'miner');
        minerCreeps.forEach(miner => {
            if (!miner.memory.source) {
                this.chooseMiningPosition(miner, minerCreeps);
            }
            creep_1.creepManager.processCreep(miner, this.minerJobs);
        });
    }
    chooseMiningPosition(creep, minerCreeps) {
        const occupiedContainers = minerCreeps.map(c => c.memory.container);
        const containers = util_1.findStructures(creep.room, [STRUCTURE_CONTAINER], FIND_STRUCTURES);
        const freeContainers = containers.filter(c => occupiedContainers.indexOf(c.id) < 0);
        console.log(containers.map(c => c.id));
        let container;
        if (freeContainers.length) {
            container = freeContainers[0];
        }
        else {
            const containerConstructions = util_1.findStructures(creep.room, [STRUCTURE_CONTAINER], FIND_CONSTRUCTION_SITES);
            const freeConstructions = containerConstructions.filter(c => occupiedContainers.indexOf(c.id) < 0);
            container = freeConstructions[0];
        }
        console.log(creep.name, container.id);
        const flag = room_1.roomManager.getMiningFlags(creep.room).filter(f => f.pos.isEqualTo(container.pos))[0];
        creep.memory.container = container.id;
        creep.memory.source = flag.memory.source;
    }
}
exports.minerCreepManager = new MinerCreepManager;
