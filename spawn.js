"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const room_1 = require("./room");
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
        const body = new Array(lvl).map(x => WORK).concat([CARRY, MOVE]);
        super('miner', body);
    }
}
class CarryCreep extends CreepType {
    constructor(lvl) {
        const carryPart = new Array(lvl).map(x => CARRY);
        const movePart = new Array(lvl).map(x => MOVE);
        const body = carryPart.concat(movePart);
        super('carry', body);
    }
}
class SpawnManager {
    constructor() {
        this.maxCreepCount = 15;
        this.creepTypes = [
            new CreepType('superior_worker', [WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]),
            new CreepType('general_lvl5', [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]),
            new CreepType('general_lvl4', [WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]),
            new CreepType('general_lvl3', [WORK, WORK, CARRY, MOVE, MOVE, MOVE]),
            new CreepType('general_lvl2', [WORK, CARRY, CARRY, MOVE, MOVE]),
            new CreepType('general_lvl1', [WORK, CARRY, MOVE])
        ];
        this.minerCreepTypes = new Array(8).map((v, idx) => new MinerCreep(8 - idx));
        this.carryCreepTypes = new Array(5).map((v, idx) => new CarryCreep(5 - idx));
    }
    loop() {
        this.creeps = Object.keys(Game.creeps).map(n => Game.creeps[n]);
        for (let name in Game.spawns) {
            const spawn = Game.spawns[name];
            if (spawn.spawning) {
                continue;
            }
            const roomCreeps = this.getCreepsByRoom(spawn.room);
            if (this.buildMinersAndCarriers(spawn, roomCreeps)) {
                continue;
            }
            ;
            this.spawnCreep(spawn, this.getEnergyInExtensions(spawn));
            this.showSpawningLabel(spawn);
        }
    }
    showSpawningLabel(spawn) {
        if (spawn.spawning) {
            var spawningCreep = Game.creeps[spawn.spawning.name];
            spawn.room.visual.text('🛠️' + spawningCreep.memory.role, spawn.pos.x + 1, spawn.pos.y, { align: 'left', opacity: 0.8 });
        }
    }
    spawnCreep(spawn, energyInExtensions) {
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
    buildMinersAndCarriers(spawn, creeps) {
        const maxMiners = Math.min(5, room_1.roomManager.getMiningFlags(spawn.room).length);
        const minerCreeps = creeps.filter(c => c.memory.role === 'miner');
        const carryCreeps = creeps.filter(c => c.memory.role === 'carry');
        if (minerCreeps.length === maxMiners || carryCreeps.length >= maxMiners) {
            return false;
        }
        let toBuildType;
        if (minerCreeps.length <= carryCreeps.length && minerCreeps.length < maxMiners) {
            toBuildType = this.minerCreepTypes;
        }
        else {
            toBuildType = this.carryCreepTypes;
        }
        const affordableLevel = toBuildType.filter(t => spawn.canCreateCreep(t.body))[0];
        if (affordableLevel) {
            spawn.createCreep(affordableLevel.body, undefined, { role: affordableLevel.name });
        }
        return true;
    }
    getCreepsByRoom(room) {
        return this.creeps.filter(c => c.room === room);
    }
}
exports.SpawnManager = SpawnManager;
exports.spawnManager = new SpawnManager();
