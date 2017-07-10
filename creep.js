"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
            new CreepJob('harvest', '#ffaa00', '🔨 harvesting', (c, t) => harvestJobAction(c, t), c => c.carry.energy == c.carryCapacity, c => c.room.find(FIND_MY_CREEPS)
                .filter(c => c.memory.job == 'mine')
                .concat(c.room.find(FIND_SOURCES)), TargetSelectionPolicy.proportionalToDistance),
            new CreepJob('fillTower', '#ffffff', 'fillTower', (c, t) => c.transfer(t, RESOURCE_ENERGY), (c, t) => c.carry.energy == 0 || t.energy == t.energyCapacity, c => this.findStructures(c, [STRUCTURE_TOWER]), TargetSelectionPolicy.distance),
            new CreepJob('fillSpawn', '#ffffff', '🏭 fillSpawn', (c, t) => c.transfer(t, RESOURCE_ENERGY), (c, t) => c.carry.energy == 0 || t.energy == t.energyCapacity, c => this.findStructures(c, [STRUCTURE_EXTENSION, STRUCTURE_SPAWN]), TargetSelectionPolicy.inOrder),
            new CreepJob('build', '#ffaa00', '🚧 build', (c, t) => c.build(t), c => c.carry.energy == 0, c => c.room.find(FIND_MY_CONSTRUCTION_SITES), TargetSelectionPolicy.distance),
            new CreepJob('smallWall', '#ffaa00', 'wall', (c, t) => c.repair(t), (c, t) => c.carry.energy == 0 || t.hits >= 500, c => this.findStructures(c, [STRUCTURE_WALL], FIND_STRUCTURES).filter(w => w.hits < 500), TargetSelectionPolicy.distance),
            new CreepJob('upgrade', '#ffaa00', '⚡ upgrade', (c, t) => c.upgradeController(t), c => c.carry.energy == 0, c => [c.room.controller], TargetSelectionPolicy.inOrder),
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
        const job = this.jobsByname[creep.memory.job];
        console.log('execute job', creep.name, job.name);
        this.jobsByname[creep.memory.job].execute(creep, creep.memory.jobTarget);
    }
    assignJob(creep) {
        this.jobs.some(j => j.targetSelectionPolicy(j.possibleTargets(creep), creep).some(target => {
            console.log(creep.name, j.name, target.id, j.jobDone(creep, target));
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
        for (let name in Game.creeps) {
            call(Game.creeps[name]);
        }
    }
    findStructures(c, structTypes, type = FIND_MY_STRUCTURES) {
        return c.room
            .find(type, {
            filter: (s) => structTypes.indexOf(s.structureType) > -1
        });
    }
}
exports.CreepManager = CreepManager;
exports.creepManager = new CreepManager();
