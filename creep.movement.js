"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const statistics_1 = require("./statistics");
const util_1 = require("./util");
class CreepMovement {
    constructor() {
        this.pathsToTarget = {};
    }
    moveCreep(creep, target) {
        if (creep.fatigue > 0)
            return OK;
        const fromKey = '' + creep.pos;
        const toKey = '' + target;
        creep.memory.prevPos = '' + creep.pos;
        this.initTo(toKey);
        let path;
        if (this.hasPath(fromKey, toKey)) {
            path = this.getPath(fromKey, toKey);
        }
        else {
            path = creep.room.findPath(creep.pos, target, { ignoreCreeps: true, serialize: true });
            this.storePath(fromKey, toKey, path);
        }
        let moveResult = creep.moveByPath(path);
        statistics_1.stats.metric('Creep::Move::' + moveResult, 1);
        if (moveResult !== OK) {
            console.log('Creep\tMove\t' + moveResult);
            statistics_1.stats.metric('Creep::Move::PATH_NOT_FOUND', 1);
            if (moveResult === ERR_NOT_FOUND) {
                creep.move(this.getRandomDirection());
            }
        }
        return moveResult;
    }
    initTo(toKey) {
        if (!this.pathsToTarget[toKey]) {
            this.pathsToTarget[toKey] = {};
        }
    }
    getRandomDirection() {
        return util_1.getRandomInt(1, 8);
    }
    getPath(fromKey, toKey) {
        return this.pathsToTarget[toKey][fromKey];
    }
    hasPath(fromKey, toKey) {
        return !!this.getPath(fromKey, toKey);
    }
    storePath(fromKey, toKey, path) {
        this.pathsToTarget[toKey][fromKey] = path;
    }
}
exports.CreepMovement = CreepMovement;
exports.creepMovement = new CreepMovement();
