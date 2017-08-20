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
        this.initTo(toKey);
        let moveResult = OK;
        if (this.isStuck(creep, fromKey)) {
            creep.move(this.getRandomDirection());
            this.setPrevPos(creep, fromKey);
            statistics_1.stats.metric('Creep::Move::Stuck', 1);
            return OK;
        }
        let path;
        if (this.hasPath(fromKey, toKey)) {
            path = this.getPath(fromKey, toKey);
            statistics_1.stats.metric('Creep::Move::Reusepath', 1);
        }
        else {
            path = creep.room.findPath(creep.pos, target, { ignoreCreeps: true, serialize: true });
            this.storePath(fromKey, toKey, path);
            statistics_1.stats.metric('Creep::Move::FindPath', 1);
        }
        moveResult = creep.moveByPath(path);
        statistics_1.stats.metric('Creep::Move::' + moveResult, 1);
        if (moveResult !== OK) {
            console.log('Creep\tMove\t' + moveResult);
            if (moveResult === ERR_NOT_FOUND) {
                creep.move(this.getRandomDirection());
            }
        }
        this.setPrevPos(creep, fromKey);
        return moveResult;
    }
    isStuck(creep, fromKey) {
        const prevPos = creep.memory.prevPos;
        if (fromKey !== prevPos)
            return false;
        if (!creep.memory.posSince)
            return false;
        if (Game.time - creep.memory.posSince > 3) {
            return true;
        }
        return false;
    }
    setPrevPos(creep, fromKey) {
        if (creep.memory.prevPos !== fromKey) {
            creep.memory.prevPos = fromKey;
            creep.memory.posSince = Game.time;
        }
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
