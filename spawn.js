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
class GeneralCreep extends CreepType {
    constructor(lvl) {
        const body = [];
        for (let i = 0; i < lvl; i++) {
            body.push(WORK);
            body.push(CARRY);
            body.push(MOVE);
        }
        super('general', body);
    }
}
class MinerCreepSpawner {
}
class SpawnManager {
    constructor() {
        this.generalCreepCount = 1;
        this.carryCreepCount = 6;
        this.generalCreepTypes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((v, idx) => new GeneralCreep(15 - idx));
        this.minerCreepTypes = [1, 2, 3, 4, 5, 6].map((v, idx) => new MinerCreep(6 - idx));
        this.carryCreepTypes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((v, idx) => new CarryCreep(20 - idx));
    }
    loop() {
        util_1.forEachRoom(room => {
            const roomData = data_1.data.of(room);
            const spawns = roomData.spawns.get();
            const availableSpawns = spawns.filter(s => !s.spawning);
            if (availableSpawns.length === 0) {
                return;
            }
            const spawnables = [];
            roomData.minerCreeps.clear();
            const spawnMiner = roomData.minerCreeps.get().length < roomData.sources.get().length;
            if (spawnMiner) {
                console.log('Spawn: miner', roomData.minerCreeps.get().length, roomData.sources.get().length);
                spawnables.push(this.minerCreepTypes);
                roomData.minerCreeps.clear();
            }
            if (roomData.carryCreeps.get().length < this.carryCreepCount) {
                spawnables.push(this.carryCreepTypes);
                roomData.carryCreeps.clear();
            }
            if (roomData.generalCreeps.get().length < this.generalCreepCount) {
                spawnables.push(this.generalCreepTypes);
                roomData.generalCreeps.clear();
            }
            availableSpawns.forEach(spawn => {
                const extensionEnergy = this.getEnergyInExtensions(spawn);
                const types = spawnables.shift();
                if (types) {
                    const creep = types.find(c => spawn.canCreateCreep(c.body) === OK);
                    if (creep) {
                        const newName = spawn.createCreep(creep.body, undefined, { role: creep.name });
                        console.log('Spawning new ' + creep.name + ' ' + newName);
                        this.showSpawningLabel(spawn);
                        return;
                    }
                }
            });
        });
    }
    showSpawningLabel(spawn) {
        if (spawn.spawning) {
            var spawningCreep = Game.creeps[spawn.spawning.name];
            spawn.room.visual.text('🛠️' + spawningCreep.memory.role, spawn.pos.x + 1, spawn.pos.y, { align: 'left', opacity: 0.8 });
        }
    }
    getEnergyInExtensions(spawn) {
        return data_1.data.of(spawn.room).extensions.get().reduce((a, s) => a + s.energy, 0);
    }
}
__decorate([
    profiler_1.Profile('Spawn')
], SpawnManager.prototype, "loop", null);
exports.SpawnManager = SpawnManager;
exports.spawnManager = new SpawnManager();
