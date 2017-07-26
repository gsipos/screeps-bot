"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Data {
    constructor() {
        this.roomData = {};
        this.creepLists = {};
    }
    reset() {
        this.roomData = {};
        this.creepLists = {};
    }
    storeTo(key, cache, func) {
        if (!cache[key]) {
            cache[key] = func();
        }
        return cache[key];
    }
    cacheByRoom(room, key, func) {
        if (!this.roomData[room.name]) {
            this.roomData[room.name] = {};
        }
        return this.storeTo(key, this.roomData[room.name], func);
    }
    cacheCreepList(key, func) {
        return this.storeTo(key, this.creepLists, func);
    }
    roomMiningFlags(room) {
        return this.cacheByRoom(room, 'miningFlags', () => room.find(FIND_FLAGS, { filter: (flag) => flag.memory.role === 'mine' }));
    }
    findStructures(room, types, where = FIND_MY_STRUCTURES) {
        return this.cacheByRoom(room, types.join('|') + where, () => room.find(where, { filter: (s) => types.indexOf(s.structureType) > -1 }));
    }
    roomContainers(room) {
        return this.findStructures(room, [STRUCTURE_CONTAINER], FIND_STRUCTURES);
    }
    roomContainerConstruction(room) {
        return this.findStructures(room, [STRUCTURE_CONTAINER], FIND_MY_CONSTRUCTION_SITES);
    }
    roomContainerContructionChanged(room) {
        delete this.roomData[room.name][STRUCTURE_CONTAINER + FIND_MY_CONSTRUCTION_SITES];
    }
    roomContainerOrStorage(room) {
        return this.findStructures(room, [STRUCTURE_CONTAINER, STRUCTURE_STORAGE], FIND_STRUCTURES);
    }
    roomExtensionOrSpawn(room) {
        return this.findStructures(room, [STRUCTURE_EXTENSION, STRUCTURE_SPAWN]);
    }
    roomExtensions(room) {
        return this.findStructures(room, [STRUCTURE_EXTENSION]);
    }
    roomTower(room) {
        return this.findStructures(room, [STRUCTURE_TOWER]);
    }
    roomRoad(room) {
        return this.findStructures(room, [STRUCTURE_ROAD], FIND_STRUCTURES);
    }
    roomWall(room) {
        return this.findStructures(room, [STRUCTURE_WALL], FIND_STRUCTURES);
    }
    roomRampart(room) {
        return this.findStructures(room, [STRUCTURE_RAMPART]);
    }
    creepList() {
        return this.cacheCreepList('all', () => Object.keys(Game.creeps).map(n => Game.creeps[n]));
    }
    creepByRole(role) {
        return this.cacheCreepList(role, () => this.creepList().filter(c => c.memory.role === role));
    }
    roomCreeps(room) {
        return this.cacheByRoom(room, 'creeps', () => this.creepList().filter(c => c.room === room));
    }
    roomCreepsByRole(room, role) {
        return this.cacheByRoom(room, 'creeps' + role, () => this.creepByRole(role).filter(c => c.room === room));
    }
    creepsByJobTarget(job, jobTarget) {
        return this.cacheCreepList(job + '|' + jobTarget, () => this.creepList().filter(c => c.memory.job === job && c.memory.jobTarget === jobTarget));
    }
    registerCreepJob(creep) {
        this.creepsByJobTarget(creep.memory.job, creep.memory.jobTarget).push(creep);
    }
}
exports.data = new Data();
