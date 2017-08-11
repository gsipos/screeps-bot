"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
class MemoryStore {
    constructor(store) {
        this.store = store;
        if (!Memory[store]) {
            Memory[store] = {};
        }
    }
    has(key) {
        return !!Memory[this.store][key];
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
class MemoryHierarchyStore {
    constructor(store) {
        this.store = store;
        if (!Memory[store]) {
            Memory[store] = {};
        }
    }
    get(path) {
        const leafKey = this.getLeafKey(path);
        const leaf = this.traversePath(path, false);
        return leaf[leafKey];
    }
    set(path, value) {
        const leafKey = this.getLeafKey(path);
        const leaf = this.traversePath(path, true);
        leaf[leafKey] = value;
    }
    has(path) {
        return !!this.get(path);
    }
    delete(path) {
        const leafKey = this.getLeafKey(path);
        const leaf = this.traversePath(path, true);
        delete leaf[leafKey];
        if (Object.keys(leaf).length === 0) {
            this.delete(path.slice(0, -1));
        }
    }
    getKeyPath(from, to) {
        return [from.roomName, '' + from.x + '|' + from.y, '' + to.x + '|' + to.y];
    }
    getLeafKey(keys) {
        return keys[keys.length - 1];
    }
    traversePath(path, makeWay) {
        let store = Memory[this.store];
        for (let i = 0; i < path.length - 1; i++) {
            const keyPart = path[i];
            if (makeWay && !store[keyPart]) {
                store[keyPart] = {};
            }
            else if (!store) {
                return undefined;
            }
            store = store[keyPart];
        }
        return store;
    }
}
;
class TTLCache {
    constructor() {
        this.cache = {};
    }
    has(key) {
        const entry = this.cache[key];
        return !!entry && entry.maxAge < Game.time;
    }
    get(key) {
        return this.cache[key].entry;
    }
    set(key, value, ttl) {
        this.cache[key] = { entry: value, maxAge: Game.time + ttl };
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
    storeTTL(key, cache, supplier, ttl) {
        if (!cache.has(key)) {
            cache.set(key, supplier(), ttl);
            this.storeMiss++;
        }
        else {
            this.storeHit++;
        }
        return cache.get(key);
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
        this.creepLists = new util_1.Temporal(() => ({}));
        this.creeps = new util_1.Temporal(() => Object.keys(Game.creeps).map(n => Game.creeps[n]));
        this.minerCreeps = new util_1.Temporal(() => this.creeps.get().filter(c => c.memory.role === 'miner'));
        this.carryCreeps = new util_1.Temporal(() => this.creeps.get().filter(c => c.memory.role === 'carry'));
        this.generalCreeps = new util_1.Temporal(() => this.creeps.get().filter(c => c.memory.role === 'general'));
        this.rooms = {};
    }
    cacheCreepList(key, func) {
        return this.storeTo(key, this.creepLists.get(), func);
    }
    creepsByJobTarget(job, jobTarget) {
        return this.cacheCreepList(job + '|' + jobTarget, () => this.creeps.get().filter(c => c.memory.job === job && c.memory.jobTarget === jobTarget));
    }
    registerCreepJob(creep) {
        this.creepsByJobTarget(creep.memory.job, creep.memory.jobTarget).push(creep);
    }
    of(room) {
        if (!this.rooms[room.name]) {
            this.rooms[room.name] = new RoomData(room);
        }
        return this.rooms[room.name];
    }
}
class RoomData {
    constructor(room) {
        this.room = room;
        this.sources = new util_1.TTL(200, () => this.room.find(FIND_SOURCES));
        this.spawns = new util_1.TTL(200, () => this.findMy(STRUCTURE_SPAWN));
        this.containers = new util_1.TTL(0, () => this.findMy(STRUCTURE_CONTAINER));
        this.storage = new util_1.TTL(10, () => this.room.storage);
        this.containerOrStorage = new util_1.TTL(10, () => [...this.containers.get(), this.room.storage]);
        this.extensions = new util_1.TTL(20, () => this.findMy(STRUCTURE_EXTENSION));
        this.extensionOrSpawns = new util_1.TTL(5, () => this.concat(this.extensions, this.spawns));
        this.towers = new util_1.TTL(200, () => this.findMy(STRUCTURE_TOWER));
        this.ramparts = new util_1.TTL(7, () => this.findMy(STRUCTURE_RAMPART));
        this.walls = new util_1.TTL(7, () => this.find(FIND_STRUCTURES, [STRUCTURE_WALL]));
        this.roads = new util_1.TTL(7, () => this.find(FIND_STRUCTURES, [STRUCTURE_ROAD]));
        this.miningFlags = new util_1.TTL(200, () => this.room.find(FIND_FLAGS, { filter: (flag) => flag.memory.role === 'mine' }));
        this.containerConstructions = new util_1.TTL(3, () => this.room.find(FIND_MY_CONSTRUCTION_SITES, [STRUCTURE_CONTAINER]));
        this.nonDefensiveStructures = new util_1.TTL(100, () => this.room.find(FIND_STRUCTURES)
            .filter(s => s.structureType !== STRUCTURE_WALL)
            .filter(s => s.structureType !== STRUCTURE_RAMPART));
        this.creeps = new util_1.Temporal(() => Object.keys(Game.creeps).map(n => Game.creeps[n]).filter(c => c.room === this.room));
        this.minerCreeps = new util_1.Temporal(() => this.creeps.get().filter(c => c.memory.role === 'miner'));
        this.carryCreeps = new util_1.Temporal(() => this.creeps.get().filter(c => c.memory.role === 'carry'));
        this.generalCreeps = new util_1.Temporal(() => this.creeps.get().filter(c => c.memory.role === 'general'));
        this.fillableCreeps = new util_1.Temporal(() => this.creeps.get()
            .filter(creep => creep.memory.role !== 'miner')
            .filter(creep => creep.memory.role !== 'carry'));
    }
    find(where, types) {
        return this.room.find(where, { filter: (s) => types.indexOf(s.structureType) > -1 });
    }
    findMy(types) { return this.find(FIND_MY_STRUCTURES, [types]); }
    concat(first, second) {
        return [].concat(first.get(), second.get());
    }
}
exports.RoomData = RoomData;
class PathStore extends BaseData {
    constructor() {
        super(...arguments);
        this.store = new MemoryStore('pathStore');
        this.renewed = 0;
    }
    getPath(from, to) {
        const key = this.getDistanceKey(from, to);
        if (!this.store.has(key)) {
            const path = from.findPathTo(to);
            const serializedPath = Room.serializePath(path);
            this.store.set(key, serializedPath);
            this.storeMiss++;
        }
        else {
            this.storeHit++;
        }
        return this.store.get(key);
    }
    renewPath(from, to) {
        this.renewed++;
        const key = this.getDistanceKey(from, to);
        this.store.delete(key);
        return this.getPath(from, to);
    }
}
exports.data = new Data();
exports.cachedData = new CachedData();
exports.pathStore = new PathStore();
