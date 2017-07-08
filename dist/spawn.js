"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CreepType {
    constructor(name, body) {
        this.name = name;
        this.body = body;
        this.cost = this.body.map(p => BODYPART_COST[p]).reduce((a, c) => a + c, 0);
    }
}
exports.CreepType = CreepType;
class SpawnManager {
    constructor() {
        this.maxCreepCount = 10;
        this.creepTypes = [
            new CreepType('superior_worker', [WORK, WORK, WORK, WORK, WORK, CARRY, MOVE]),
            new CreepType('advanced_general', [WORK, WORK, CARRY, CARRY, MOVE, MOVE]),
            new CreepType('basic_general', [WORK, CARRY, MOVE])
        ];
    }
    loop() {
        for (let name in Game.spawns) {
            const spawn = Game.spawns[name];
            this.spawnCreep(spawn);
            this.showSpawningLabel(spawn);
        }
    }
    showSpawningLabel(spawn) {
        if (spawn.spawning) {
            var spawningCreep = Game.creeps[spawn.spawning.name];
            spawn.room.visual.text('🛠️' + spawningCreep.memory.role, spawn.pos.x + 1, spawn.pos.y, { align: 'left', opacity: 0.8 });
        }
    }
    spawnCreep(spawn) {
        if (Object.keys(Game.creeps).length >= this.maxCreepCount) {
            return;
        }
        const creep = this.creepTypes.filter(c => spawn.energy > c.cost)[0];
        if (creep) {
            const newName = spawn.createCreep(creep.body, undefined, { role: creep.name });
            console.log('Spawning new ' + creep.name + ' ' + newName);
        }
    }
}
exports.SpawnManager = SpawnManager;
exports.spawnManager = new SpawnManager();
