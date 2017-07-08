"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CreepJob {
    constructor(name, color, say, action, jobDone, possibleTargets) {
        this.name = name;
        this.color = color;
        this.say = say;
        this.action = action;
        this.jobDone = jobDone;
        this.possibleTargets = possibleTargets;
    }
    execute(creep, target) {
        const result = this.action(creep, target);
        if (result == ERR_NOT_IN_RANGE) {
            creep.moveTo(target, { visualizePathStyle: { stroke: this.color } });
        }
        else if (result !== OK) {
            this.finishJob(creep, target);
            return;
        }
        if (this.jobDone(creep, target)) {
            this.finishJob(creep, target);
        }
    }
    finishJob(creep, target) {
        delete creep.memory.job;
        delete creep.memory.jobTarget;
    }
}
exports.CreepJob = CreepJob;
function harvestJobAction(creep, target) {
    const result = creep.harvest(target);
    if (result == OK) {
        creep.room
            .find(FIND_MY_CREEPS)
            .some(c => creep.transfer(c, RESOURCE_ENERGY) == OK);
    }
    return result;
}
class CreepManager {
    constructor() {
        this.jobs = [
            new CreepJob('harvest', '#ffaa00', '🔨 harvesting', (c, t) => harvestJobAction(c, t), c => c.carry.energy == c.carryCapacity, c => c.room.find(FIND_SOURCES)),
            new CreepJob('fillSpawn', '#ffffff', '🏭 fillSpawn', (c, t) => c.transfer(t, RESOURCE_ENERGY), (c, t) => c.carry.energy == 0 || t.energy == t.energyCapacity, c => this.findStructures(c, [STRUCTURE_EXTENSION, STRUCTURE_SPAWN])),
            new CreepJob('build', '#ffaa00', '🚧 build', (c, t) => c.build(t), c => c.carry.energy == 0, c => [c.room.controller]),
            new CreepJob('upgrade', '#ffaa00', '⚡ upgrade', (c, t) => c.upgradeController(t), c => c.carry.energy == 0, c => [c.room.controller]),
        ];
        this.jobsByname = {};
        this.jobs.forEach(j => this.jobsByname[j.name] = j);
    }
    loop() {
        this.foreEachCreep(creep => {
            if (!creep.memory.job) {
                this.assignJob(creep);
            }
            if (creep.memory.job) {
                this.executeJob(creep);
            }
        });
    }
    executeJob(creep) {
        this.jobsByname[creep.memory.job].execute(creep, creep.memory.jobTarget);
    }
    assignJob(creep) {
        this.jobs.some(j => j.possibleTargets(creep).some(target => {
            if (!j.jobDone(creep, target)) {
                creep.memory.job = j.name;
                creep.memory.job = target.id;
                return true;
            }
            else {
                return false;
            }
        }));
    }
    foreEachCreep(call) {
        for (let name in Game.creeps) {
            call(Game.creeps[name]);
        }
    }
    findStructures(c, structTypes) {
        return c.room
            .find(FIND_MY_STRUCTURES)
            .filter(s => structTypes.indexOf(s.structureType) > -1);
    }
}
exports.CreepManager = CreepManager;
exports.creepManager = new CreepManager();
