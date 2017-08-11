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
        this.roomData = {};
        this.roomDataTTL = {};
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
    cacheByRoomTTL(room, key, func, ttl) {
        if (!this.roomDataTTL[room.name]) {
            this.roomDataTTL[room.name] = new TTLCache();
        }
        return this.storeTTL(key, this.roomDataTTL[room.name], func, ttl);
    }
    cacheCreepList(key, func) {
        return this.storeTo(key, this.creepLists, func);
    }
    roomMiningFlags(room) {
        return this.cacheByRoom(room, 'miningFlags', () => room.find(FIND_FLAGS, { filter: (flag) => flag.memory.role === 'mine' }));
    }
    findStructures(room, types, where = FIND_MY_STRUCTURES, ttl = 0) {
        const roomFindWhere = () => room.find(where, { filter: (s) => types.indexOf(s.structureType) > -1 });
        const key = types.join('|') + where;
        if (ttl > 0) {
            return this.cacheByRoomTTL(room, key, roomFindWhere, ttl);
        }
        else {
            return this.cacheByRoom(room, key, roomFindWhere);
        }
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
        return this.findStructures(room, [STRUCTURE_CONTAINER, STRUCTURE_STORAGE], FIND_STRUCTURES, 3);
    }
    roomExtensionOrSpawn(room) {
        return this.findStructures(room, [STRUCTURE_EXTENSION, STRUCTURE_SPAWN]);
    }
    roomExtensions(room) {
        return this.findStructures(room, [STRUCTURE_EXTENSION], FIND_MY_STRUCTURES, 3);
    }
    roomTower(room) {
        return this.findStructures(room, [STRUCTURE_TOWER], FIND_MY_STRUCTURES, 7);
    }
    roomRoad(room) {
        return this.findStructures(room, [STRUCTURE_ROAD], FIND_STRUCTURES, 10);
    }
    roomWall(room) {
        return this.findStructures(room, [STRUCTURE_WALL], FIND_STRUCTURES, 5);
    }
    roomRampart(room) {
        return this.findStructures(room, [STRUCTURE_RAMPART], FIND_MY_STRUCTURES, 7);
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
        this.hierarchyStore = new MemoryHierarchyStore('pathTreeStore');
        this.hierarchyStore2 = new MemoryHierarchyStore('pathTreeStore2');
        this.renewed = 0;
    }
    getPath(from, to) {
        const key = this.getDistanceKey(from, to);
        const keyPath = this.hierarchyStore.getKeyPath(from, to);
        if (!this.store.has(key)) {
            const path = from.findPathTo(to);
            const serializedPath = Room.serializePath(path);
            this.store.set(key, serializedPath);
            this.hierarchyStore.set(keyPath, serializedPath);
            this.hierarchyStore2.set(this.hierarchyStore2.getKeyPath(to, from), serializedPath);
            this.storeMiss++;
        }
        else {
            this.storeHit++;
        }
        const result = this.store.get(key);
        const result2 = this.hierarchyStore.get(keyPath);
        if (result != result2) {
            console.warn('Hierarhy and simple path store are different', result, result2);
        }
        return result2;
    }
    renewPath(from, to) {
        this.renewed++;
        const key = this.getDistanceKey(from, to);
        const path = this.hierarchyStore.getKeyPath(from, to);
        this.store.delete(key);
        this.hierarchyStore.delete(path);
        this.hierarchyStore2.delete(this.hierarchyStore2.getKeyPath(to, from));
        return this.getPath(from, to);
    }
}
class PathHierarchyStore {
    constructor() {
        if (!this.store) {
            Memory.pathHierarchyStore = {};
        }
    }
    get store() {
        return Memory.pathHiearchyStore;
    }
}
exports.data = new Data();
exports.cachedData = new CachedData();
exports.pathStore = new PathStore();
