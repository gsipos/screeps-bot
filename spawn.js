"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const room_1 = require("./room");
const util_1 = require("./util");
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
        this.creepTypes = [
            new CreepType('general', [WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]),
            new CreepType('general', [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]),
            new CreepType('general', [WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]),
            new CreepType('general', [WORK, WORK, CARRY, MOVE, MOVE, MOVE]),
            new CreepType('general', [WORK, CARRY, CARRY, MOVE, MOVE]),
            new CreepType('general', [WORK, CARRY, MOVE])
        ];
        this.minerCreepTypes = [1, 2, 3, 4, 5, 6, 7, 8].map((v, idx) => new MinerCreep(8 - idx));
        this.carryCreepTypes = [1, 2, 3, 4, 5].map((v, idx) => new CarryCreep(5 - idx));
    }
    loop() {
        this.creeps = Object.keys(Game.creeps).map(n => Game.creeps[n]);
        for (let name in Game.spawns) {
            const spawn = Game.spawns[name];
            const extensionEnergy = this.getEnergyInExtensions(spawn);
            if (spawn.spawning) {
                continue;
            }
            const roomCreeps = this.getCreepsByRoom(spawn.room);
            if (this.buildMinersAndCarriers(spawn, roomCreeps, extensionEnergy)) {
                continue;
            }
            ;
            this.spawnGeneralCreep(spawn, extensionEnergy);
            this.showSpawningLabel(spawn);
        }
    }
    showSpawningLabel(spawn) {
        if (spawn.spawning) {
            var spawningCreep = Game.creeps[spawn.spawning.name];
            spawn.room.visual.text('🛠️' + spawningCreep.memory.role, spawn.pos.x + 1, spawn.pos.y, { align: 'left', opacity: 0.8 });
        }
    }
    spawnGeneralCreep(spawn, energyInExtensions) {
        if (spawn.spawning) {
            return;
        }
        if (Object.keys(Game.creeps).length >= this.maxCreepCount) {
            return;
        }
        const creep = this.creepTypes.filter(c => (spawn.energy + energyInExtensions) > c.cost)[0];
        if (creep) {
            const newName = spawn.createCreep(creep.body, undefined, { role: creep.name });
            console.log('Spawning new ' + creep.name + ' ' + newName);
        }
    }
    getEnergyInExtensions(spawn) {
        return spawn.room.find(FIND_MY_STRUCTURES)
            .filter(s => s.structureType == STRUCTURE_EXTENSION)
            .reduce((a, s) => a + s.energy, 0);
    }
    buildMinersAndCarriers(spawn, creeps, energyInExtensions) {
        const miningFlags = room_1.roomManager.getMiningFlags(spawn.room);
        if (!miningFlags.length) {
            return true;
        }
        const maxMiners = Math.min(5, room_1.roomManager.getMiningFlags(spawn.room).length);
        const minerCreeps = creeps.filter(c => c.memory.role === 'miner');
        const carryCreeps = creeps.filter(c => c.memory.role === 'carry');
        console.log('maxMiner', maxMiners, minerCreeps.length, carryCreeps.length);
        if (minerCreeps.length >= maxMiners && carryCreeps.length >= maxMiners) {
            return false;
        }
        let toBuildType;
        const lessOrEqualMinersThanCarrys = minerCreeps.length <= carryCreeps.length;
        const noMaxMiners = minerCreeps.length < maxMiners;
        const noContainer = !util_1.findStructures(spawn.room, [STRUCTURE_CONTAINER], FIND_STRUCTURES).length;
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
    getCreepsByRoom(room) {
        return this.creeps.filter(c => c.room === room);
    }
}
exports.SpawnManager = SpawnManager;
exports.spawnManager = new SpawnManager();
