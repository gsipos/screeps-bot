"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const profiler_1 = require("./profiler");
const data_1 = require("./data");
class TowerManager {
    constructor() {
        this.jobTTL = 5;
        if (!Memory.towers) {
            Memory.towers = {};
        }
    }
    loop() {
        for (let name in Game.rooms) {
            const room = Game.rooms[name];
            data_1.data.of(room).towers.get().forEach(tower => {
                let towerMemory = this.getTowerMemory(tower.id);
                if (!towerMemory) {
                    towerMemory = this.assignJobToTower(tower);
                }
                this.executeTowerJob(tower, towerMemory);
            });
        }
    }
    executeTowerJob(tower, memory) {
        const target = Game.getObjectById(memory.jobTarget);
        if (!target) {
            this.jobDone(tower);
        }
        let result = OK;
        if (memory.job === 'jobless') {
            result = OK - 1;
        }
        if (memory.job === 'attack') {
            result = tower.attack(target);
        }
        if (memory.job === 'repair') {
            result = tower.repair(target);
        }
        if (memory.job === 'heal') {
            result = tower.heal(target);
        }
        if (result !== OK) {
            this.jobDone(tower);
        }
    }
    assignJobToTower(tower) {
        var towerMemory;
        var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (closestHostile) {
            return this.createJob('attack', tower, closestHostile);
        }
        var decayingRampart = data_1.data.of(tower.room).ramparts.get().find(r => r.hits < 500);
        if (decayingRampart) {
            return this.createJob('repair', tower, decayingRampart);
        }
        var damagedStructure = data_1.data.of(tower.room).nonDefensiveStructures.get().find(s => s.hits > s.hitsMax);
        if (damagedStructure) {
            return this.createJob('repair', tower, damagedStructure);
        }
        var damagedCreep = data_1.data.of(tower.room).creeps.get().find(c => c.hits < c.hitsMax);
        if (damagedCreep) {
            return this.createJob('heal', tower, damagedCreep);
        }
        return this.createJob('jobless', tower, { id: 'nojob' });
    }
    createJob(job, tower, target) {
        const towerMemory = { job: job, jobTarget: target.id };
        Memory.towers[tower.id] = towerMemory;
        return towerMemory;
    }
    jobDone(tower) {
        delete Memory.towers[tower.id];
    }
    getTowerMemory(towerId) {
        return Memory.towers[towerId];
    }
}
__decorate([
    profiler_1.Profile('Tower')
], TowerManager.prototype, "loop", null);
exports.towerManager = new TowerManager();
