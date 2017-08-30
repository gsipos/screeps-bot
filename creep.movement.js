"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const statistics_1 = require("./statistics");
const util_1 = require("./util");
const profiler_1 = require("./profiler");
const messaging_1 = require("./messaging");
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
        if (this.isStuck(creep)) {
            creep.move(this.getRandomDirection());
            this.setPrevPos(creep);
            statistics_1.stats.metric('Creep::Move::Stuck', 1);
            return OK;
        }
        let path;
        if (this.hasPath(fromKey, toKey)) {
            path = this.getPath(fromKey, toKey);
            statistics_1.stats.metric('Creep::Move::Reusepath', 1);
        }
        else {
            path = profiler_1.profiler.wrap('Creep::Move::findPath', () => creep.room.findPath(creep.pos, target, { ignoreCreeps: true, serialize: true }));
            messaging_1.messaging.send('path', fromKey + '|' + toKey + '|' + path);
            this.storePath(fromKey, toKey, path);
            statistics_1.stats.metric('Creep::Move::FindPath', 1);
        }
        moveResult = profiler_1.profiler.wrap('Creep::Move::moveByPath', () => creep.moveByPath(path));
        statistics_1.stats.metric('Creep::Move::' + moveResult, 1);
        if (moveResult !== OK) {
            console.log('Creep\tMove\t' + moveResult);
            if (moveResult === ERR_NOT_FOUND) {
                creep.move(this.getRandomDirection());
            }
        }
        this.setPrevPos(creep);
        return moveResult;
    }
    isStuck(creep) {
        if (!creep.memory.posSince)
            return false;
        if (Game.time - creep.memory.posSince > 3) {
            return true;
        }
        return false;
    }
    setPrevPos(creep) {
        const creepPos = '' + creep.pos;
        if (creep.memory.prevPos !== creepPos) {
            creep.memory.prevPos = creepPos;
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
    loop() {
        messaging_1.messaging.consumeMessages('path').forEach(m => {
            console.log('consume message', m);
            const splitMessage = m.value.split('|');
            this.storePath(splitMessage[0], splitMessage[1], splitMessage[2]);
        });
    }
}
__decorate([
    profiler_1.Profile('Creep::Move')
], CreepMovement.prototype, "loop", null);
exports.CreepMovement = CreepMovement;
exports.creepMovement = new CreepMovement();
