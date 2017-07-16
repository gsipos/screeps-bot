"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
class TargetSelectionPolicy {
    static random(targets) {
        return targets.sort(() => Math.floor((Math.random() * 3)) - 1);
    }
    static inOrder(targets) {
        return targets;
    }
    static distance(targets, creep) {
        const distances = new WeakMap();
        targets.forEach(t => distances.set(t, creep.pos.getRangeTo(t)));
        return targets.sort((a, b) => distances.get(a) - distances.get(b));
    }
    static proportionalToDistance(targets, creep) {
        let distance = targets.map(t => creep.pos.getRangeTo(t));
        const sumDistance = distance.reduce((a, b) => a + b, 0);
        const weights = distance.map(d => sumDistance / d);
        const sumWeight = weights.reduce((a, b) => a + b, 0);
        const weightByTarget = new WeakMap();
        targets.forEach((t, idx) => weightByTarget.set(t, weights[idx]));
        const targetsByWeightDesc = targets.sort((a, b) => weightByTarget.get(b) - weightByTarget.get(a));
        let probability = Math.random() * sumWeight;
        console.log('Prob:', probability, 'sumwhe', sumWeight, targetsByWeightDesc.map(t => weightByTarget.get(t)));
        while (probability > 0.0) {
            probability -= weightByTarget.get(targetsByWeightDesc[0]);
            if (probability > 0.0) {
                targetsByWeightDesc.shift();
            }
        }
        console.log('Wheights', targetsByWeightDesc.map(t => weightByTarget.get(t)));
        return targetsByWeightDesc;
    }
}
exports.TargetSelectionPolicy = TargetSelectionPolicy;
class CreepJob {
    constructor(name, color, say, action, jobDone, possibleTargets, targetSelectionPolicy) {
        this.name = name;
        this.color = color;
        this.say = say;
        this.action = action;
        this.jobDone = jobDone;
        this.possibleTargets = possibleTargets;
        this.targetSelectionPolicy = targetSelectionPolicy;
    }
    execute(creep, targetId) {
        const target = Game.getObjectById(targetId);
        if (this.jobDone(creep, target)) {
            this.finishJob(creep, target);
            return;
        }
        const result = this.action(creep, target);
        console.log(this.name, creep.name, result);
        if (result == ERR_NOT_IN_RANGE) {
            const moveResult = creep.moveTo(target, { visualizePathStyle: { stroke: this.color } });
            if (moveResult == ERR_NO_PATH) {
                this.finishJob(creep, target);
            }
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
            new CreepJob('idle', '#ffaa00', 'idle', c => 0, c => (c.carry.energy || 0) > 0, c => [c], TargetSelectionPolicy.inOrder),
            new CreepJob('build', '#ffaa00', '🚧 build', (c, t) => c.build(t), c => c.carry.energy == 0, c => c.room.find(FIND_MY_CONSTRUCTION_SITES), TargetSelectionPolicy.distance),
            new CreepJob('smallWall', '#ffaa00', 'wall', (c, t) => c.repair(t), (c, t) => c.carry.energy == 0 || t.hits >= 500, c => this.findStructures(c, [STRUCTURE_WALL], FIND_STRUCTURES).filter(w => w.hits < 500), TargetSelectionPolicy.distance),
            new CreepJob('maintainRoad', '#ffaa00', 'road', (c, t) => c.repair(t), (c, t) => c.carry.energy == 0 || t.hits === t.hitsMax, c => this.findStructures(c, [STRUCTURE_ROAD], FIND_STRUCTURES).filter(w => w.hits < w.hitsMax), TargetSelectionPolicy.distance),
            new CreepJob('upgrade', '#ffaa00', '⚡ upgrade', (c, t) => c.upgradeController(t), c => c.carry.energy == 0, c => [c.room.controller], TargetSelectionPolicy.inOrder),
        ];
        this.sourcesByRoom = new Map();
    }
    loop() {
        this.foreEachCreep(creep => {
            this.processCreep(creep, this.jobs);
        });
    }
    processCreep(creep, jobs) {
        const jobsByName = {};
        jobs.forEach(j => jobsByName[j.name] = j); // TODO
        if (!creep.memory.job) {
            this.assignJob(creep, jobs);
        }
        if (creep.memory.job) {
            this.executeJob(creep, jobsByName);
        }
    }
    executeJob(creep, jobsByName) {
        const job = jobsByName[creep.memory.job];
        jobsByName[creep.memory.job].execute(creep, creep.memory.jobTarget);
    }
    assignJob(creep, jobs) {
        jobs.some(j => j.targetSelectionPolicy(j.possibleTargets(creep), creep).some(target => {
            if (!j.jobDone(creep, target)) {
                creep.memory.job = j.name;
                creep.memory.jobTarget = target.id;
                creep.say(j.say);
                return true;
            }
            else {
                return false;
            }
        }));
    }
    foreEachCreep(call) {
        Object
            .keys(Game.creeps)
            .map(name => Game.creeps[name])
            .filter(c => c.memory.role === 'general')
            .forEach(c => call(c));
    }
    getCreepsByRole(role) {
        return Object.keys(Game.creeps)
            .map(c => Game.creeps[c])
            .filter(c => c.memory.role === role);
    }
    findStructures(c, structTypes, type = FIND_MY_STRUCTURES) {
        return util_1.findStructures(c.room, structTypes, type); // TODO
    }
    getSourcesForRoom(room) {
        if (!this.sourcesByRoom.has(room)) {
            this.sourcesByRoom.set(room, room.find(FIND_SOURCES));
        }
        return this.sourcesByRoom.get(room);
    }
}
exports.CreepManager = CreepManager;
exports.creepManager = new CreepManager();
class MinerCreepManager {
    loop() {
    }
}