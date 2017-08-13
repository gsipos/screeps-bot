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
const statistics_1 = require("./statistics");
class TargetSelectionPolicy {
    static random(targets) {
        return targets.sort(() => Math.floor((Math.random() * 3)) - 1);
    }
    static inOrder(targets) {
        return targets;
    }
    static distance(targets, creep) {
        const distances = new WeakMap();
        targets.forEach(t => distances.set(t, data_1.cachedData.getDistanceFromMap(creep.pos, t.pos)));
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
    constructor(name, color, say, action, jobDone, possibleTargets, targetSelectionPolicy, enoughCreepAssigned = () => false) {
        this.name = name;
        this.color = color;
        this.say = say;
        this.action = action;
        this.jobDone = jobDone;
        this.possibleTargets = possibleTargets;
        this.targetSelectionPolicy = targetSelectionPolicy;
        this.enoughCreepAssigned = enoughCreepAssigned;
    }
    execute(creep, targetId) {
        const target = Game.getObjectById(targetId);
        if (!target) {
            this.finishJob(creep, target);
            return;
        }
        if (this.jobDone(creep, target)) {
            this.finishJob(creep, target);
            return;
        }
        const result = this.action(creep, target);
        if (result == ERR_NOT_IN_RANGE) {
            this.moveCreep(creep, target);
        }
        else if (result !== OK) {
            this.finishJob(creep, target);
            return;
        }
        if (this.jobDone(creep, target)) {
            this.finishJob(creep, target);
        }
    }
    moveCreep(creep, target) {
        if (creep.fatigue) {
            creep.say('tired');
            return;
        }
        if (!creep.memory.path) {
            creep.memory.path = data_1.pathStore.getPath(creep.room, creep.pos, target.pos);
        }
        const currentPos = '' + creep.pos.x + creep.pos.y;
        const moveResult = creep.moveByPath(creep.memory.path);
        statistics_1.stats.metric('Creep::Move::' + moveResult, 1);
        if (moveResult === ERR_NOT_FOUND) {
            console.log('WARN: Path not found for creep', creep, creep.memory.path, creep.pos, target.pos);
            creep.memory.path = undefined;
        }
        else if (moveResult !== ERR_TIRED && currentPos === creep.memory.prevPos) {
            creep.memory.path = data_1.pathStore.renewPath(creep.room, creep.pos, target.pos);
        }
        if (moveResult == ERR_NO_PATH) {
            this.finishJob(creep, target);
        }
        creep.memory.prevPos = currentPos;
    }
    finishJob(creep, target) {
        delete creep.memory.job;
        delete creep.memory.jobTarget;
        delete creep.memory.path;
    }
    needMoreCreeps(target) {
        const assignedCreeps = data_1.data.creepsByJobTarget(this.name, target.id);
        return !this.enoughCreepAssigned(assignedCreeps, target);
    }
}
exports.CreepJob = CreepJob;
class CreepManager {
    constructor() {
        this.jobs = [
            new CreepJob('idle', '#ffaa00', 'idle', c => 0, c => (c.carry.energy || 0) > 0, c => [c], TargetSelectionPolicy.inOrder),
            new CreepJob('build', '#ffaa00', '🚧 build', (c, t) => c.build(t), c => c.carry.energy == 0, c => c.room.find(FIND_MY_CONSTRUCTION_SITES), TargetSelectionPolicy.distance),
            new CreepJob('smallWall', '#ffaa00', 'wall', (c, t) => c.repair(t), (c, t) => c.carry.energy == 0 || t.hits >= 500, c => data_1.data.of(c.room).walls.get().filter(w => w.hits < 500), TargetSelectionPolicy.distance),
            new CreepJob('upgrade', '#ffaa00', '⚡ upgrade', (c, t) => c.upgradeController(t), c => c.carry.energy == 0, c => [c.room.controller], TargetSelectionPolicy.inOrder),
        ];
    }
    loop() {
        data_1.data.generalCreeps.get().forEach(creep => this.processCreep(creep, this.jobs));
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
        jobs.some(j => j.targetSelectionPolicy(j
            .possibleTargets(creep)
            .filter(t => !j.jobDone(creep, t))
            .filter(t => j.needMoreCreeps(t)), creep)
            .some(target => {
            if (!j.jobDone(creep, target)) {
                creep.memory.job = j.name;
                creep.memory.jobTarget = target.id;
                creep.say(j.say);
                data_1.data.registerCreepJob(creep);
                return true;
            }
            else {
                return false;
            }
        }));
    }
}
__decorate([
    profiler_1.Profile('Creep')
], CreepManager.prototype, "loop", null);
exports.CreepManager = CreepManager;
exports.creepManager = new CreepManager();
