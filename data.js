"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MemoryStore {
    constructor(store) {
        this.store = store;
        if (!Memory[store]) {
            Memory[store] = {};
        }
    }
    has(key) {
        return key in Memory[this.store];
    }
    get(key) {
        return Memory[this.store][key];
    }
    set(key, value) {
        Memory[this.store][key] = value;
    }
    delete(key) {
        if (Memory[this.store]) {
            delete Memory[this.store][key];
        }
    }
}
class BaseData {
    constructor() {
        this.storeHit = 0;
        this.storeMiss = 0;
    }
    storeTo(key, cache, func) {
        if (!cache[key]) {
            cache[key] = func();
            this.storeMiss++;
        }
        else {
            this.storeHit++;
        }
        return cache[key];
    }
    getDistanceKey(from, to) {
        return `${from.roomName}|${from.x}:${from.y}|${to.x}:${to.y}`;
    }
}
class CachedData extends BaseData {
    constructor() {
        super(...arguments);
        this.distances = {};
    }
    getDistance(from, to) {
        const key = this.getDistanceKey(from, to);
        return this.storeTo(key, this.distances, () => from.getRangeTo(to));
    }
}
class Data extends BaseData {
    constructor() {
        super(...arguments);
        this.roomData = {};
        this.creepLists = {};
    }
    reset() {
        this.roomData = {};
        this.creepLists = {};
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
class PathStore extends BaseData {
    constructor() {
        super(...arguments);
        this.store = new MemoryStore('pathStore');
    }
    getPath(from, to) {
        const key = this.getDistanceKey(from, to);
        if (!this.store.has(key)) {
            const path = from.findPathTo(to);
            const serializedPath = Room.serializePath(path);
            this.store.set(key, serializedPath);
        }
        return this.store.get(key);
    }
    renewPath(from, to) {
        const key = this.getDistanceKey(from, to);
        this.store.delete(key);
        return this.getPath(from, to);
    }
}
exports.data = new Data();
exports.cachedData = new CachedData();
exports.pathStore = new PathStore();
