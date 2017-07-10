"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TowerManager {
    constructor() {
        this.jobTTL = 5;
        if (!Memory.towers) {
            Memory.towers = {};
        }
    }
    loop() {
        const towers = this.getTowers();
        towers.forEach(tower => {
            this.clearExpiredJob(tower);
            let towerMemory = this.getTowerMemory(tower.id);
            if (!towerMemory) {
                towerMemory = this.assignJobToTower(tower);
            }
            this.executeTowerJob(tower, towerMemory);
        });
    }
    executeTowerJob(tower, memory) {
        const target = Game.getObjectById(memory.jobTarget);
        if (!target) {
            this.jobDone(tower);
        }
        memory.jobTTL--;
        if (memory.job === 'jobless') {
            return;
        }
        if (memory.job === 'attack') {
            tower.attack(target);
        }
        if (memory.job === 'repair') {
            tower.repair(target);
        }
        if (memory.job === 'heal') {
            tower.heal(target);
        }
    }
    assignJobToTower(tower) {
        var towerMemory;
        var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (closestHostile) {
            return this.createJob('attack', tower, closestHostile);
        }
        var closestDamagedStructure = tower.pos.findClosestByRange(FIND_MY_STRUCTURES, {
            filter: (structure) => structure.hits < structure.hitsMax
        });
        if (closestDamagedStructure) {
            return this.createJob('repair', tower, closestDamagedStructure);
        }
        var closestDamagedCreep = tower.pos.findClosestByRange(FIND_MY_CREEPS, {
            filter: (creep) => creep.hits < creep.hitsMax
        });
        if (closestDamagedCreep) {
            return this.createJob('heal', tower, closestDamagedCreep);
        }
        return this.createJob('jobless', tower, { id: 'nojob' });
    }
    createJob(job, tower, target) {
        const towerMemory = { job: job, jobTarget: target.id, jobTTL: this.jobTTL };
        Memory.towers[tower.id] = towerMemory;
        return towerMemory;
    }
    getTowers() {
        return Object.keys(Game.structures)
            .map(id => Game.structures[id])
            .filter(s => s.structureType === STRUCTURE_TOWER);
    }
    clearExpiredJob(tower) {
        let mem = this.getTowerMemory(tower.id);
        if (mem && mem.jobTTL <= 0) {
            this.jobDone(tower);
        }
    }
    jobDone(tower) {
        delete Memory.towers[tower.id];
    }
    getTowerMemory(towerId) {
        return Memory.towers[towerId];
    }
}
exports.towerManager = new TowerManager();
