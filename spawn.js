"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const data_1 = require("./data");
const profiler_1 = require("./profiler");
class CreepType {
    constructor(name, body) {
        this.name = name;
        this.body = body;
        this.cost = this.body.map(p => BODYPART_COST[p]).reduce((a, c) => a + c, 0);
    }
}
exports.CreepType = CreepType;
class MinerCreep extends CreepType {
    constructor(lvl) {
        const body = [];
        for (let i = 0; i < lvl; i++) {
            body.push(WORK);
        }
        body.push(CARRY);
        body.push(MOVE);
        super('miner', body);
    }
}
class CarryCreep extends CreepType {
    constructor(lvl) {
        const body = [];
        for (let i = 0; i < lvl; i++) {
            body.push(CARRY);
            body.push(MOVE);
        }
        super('carry', body);
    }
}
class SpawnManager {
    constructor() {
        this.maxCreepCount = 13;
        this.generalCreepCount = 1;
        this.carryCreepCount = 6;
        this.creepTypes = [
            new CreepType('general', [WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]),
            new CreepType('general', [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]),
            new CreepType('general', [WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]),
            new CreepType('general', [WORK, WORK, CARRY, MOVE, MOVE, MOVE]),
            new CreepType('general', [WORK, CARRY, CARRY, MOVE, MOVE]),
            new CreepType('general', [WORK, CARRY, MOVE])
        ];
        this.minerCreepTypes = [1, 2, 3, 4, 5, 6].map((v, idx) => new MinerCreep(6 - idx));
        this.carryCreepTypes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((v, idx) => new CarryCreep(20 - idx));
    }
    loop() {
        this.creeps = data_1.data.creepList();
        for (let name in Game.spawns) {
            const spawn = Game.spawns[name];
            const extensionEnergy = this.getEnergyInExtensions(spawn);
            if (spawn.spawning) {
                continue;
            }
            const roomCreeps = data_1.data.roomCreeps(spawn.room);
            if (this.buildMinersAndCarriers(spawn, roomCreeps, extensionEnergy)) {
                continue;
            }
            ;
            if (this.spawnGeneralCreep(spawn, extensionEnergy, roomCreeps)) {
                continue;
            }
            ;
            if (this.spawnCarriers(spawn, extensionEnergy, roomCreeps)) {
                continue;
            }
            ;
            this.showSpawningLabel(spawn);
        }
    }
    showSpawningLabel(spawn) {
        if (spawn.spawning) {
            var spawningCreep = Game.creeps[spawn.spawning.name];
            spawn.room.visual.text('🛠️' + spawningCreep.memory.role, spawn.pos.x + 1, spawn.pos.y, { align: 'left', opacity: 0.8 });
        }
    }
    spawnGeneralCreep(spawn, energyInExtensions, roomCreeps) {
        const generalCreeps = data_1.data.roomCreepsByRole(spawn.room, 'general');
        if (spawn.spawning) {
            return false;
        }
        if (generalCreeps.length >= this.generalCreepCount) {
            return false;
        }
        const creep = this.creepTypes.filter(c => (spawn.energy + energyInExtensions) > c.cost)[0];
        if (creep) {
            const newName = spawn.createCreep(creep.body, undefined, { role: creep.name });
            console.log('Spawning new ' + creep.name + ' ' + newName);
            return true;
        }
    }
    spawnCarriers(spawn, energyInExtensions, roomCreeps) {
        const carryCreeps = data_1.data.roomCreepsByRole(spawn.room, 'carry');
        if (spawn.spawning) {
            return false;
        }
        if (carryCreeps.length >= this.carryCreepCount) {
            return false;
        }
        const creep = this.carryCreepTypes.filter(c => (spawn.energy + energyInExtensions) > c.cost)[0];
        if (creep) {
            const newName = spawn.createCreep(creep.body, undefined, { role: creep.name });
            console.log('Spawning new ' + creep.name + ' ' + newName);
            return true;
        }
        return false;
    }
    getEnergyInExtensions(spawn) {
        return data_1.data.roomExtensions(spawn.room).reduce((a, s) => a + s.energy, 0);
    }
    buildMinersAndCarriers(spawn, creeps, energyInExtensions) {
        const miningFlags = data_1.data.roomMiningFlags(spawn.room);
        if (!miningFlags.length) {
            return true;
        }
        const maxMiners = Math.min(5, miningFlags.length);
        const minerCreeps = data_1.data.roomCreepsByRole(spawn.room, 'miner');
        const carryCreeps = data_1.data.roomCreepsByRole(spawn.room, 'carry');
        if (minerCreeps.length >= maxMiners && carryCreeps.length >= maxMiners) {
            return false;
        }
        let toBuildType;
        const lessOrEqualMinersThanCarrys = minerCreeps.length <= carryCreeps.length;
        const noMaxMiners = minerCreeps.length < maxMiners;
        const noContainer = !data_1.data.roomContainers(spawn.room).length;
        if ((lessOrEqualMinersThanCarrys || noContainer) && noMaxMiners) {
            toBuildType = this.minerCreepTypes;
            console.log('Build: miner');
        }
        else {
            toBuildType = this.carryCreepTypes;
            console.log('Build: carry');
        }
        const affordableLevel = toBuildType.filter(c => (spawn.energy + energyInExtensions) > c.cost)[0];
        if (affordableLevel) {
            spawn.createCreep(affordableLevel.body, undefined, { role: affordableLevel.name });
            return true;
        }
        else {
            return false;
        }
    }
}
__decorate([
    profiler_1.Profile('Spawn')
], SpawnManager.prototype, "loop", null);
exports.SpawnManager = SpawnManager;
exports.spawnManager = new SpawnManager();
