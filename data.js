"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
const statistics_1 = require("./statistics");
const cache_ttl_adaptive_1 = require("./cache.ttl.adaptive");
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
class BaseData {
    storeTo(key, cache, func) {
        if (!cache[key]) {
            cache[key] = func();
        }
        else {
        }
        return cache[key];
    }
    getDistanceKey(from, to) {
        return `${from.roomName}|${from.x}:${from.y}|${to.x}:${to.y}`;
    }
}
class CachedData {
    constructor() {
        this.distanceMap = new Map();
    }
    getDistanceFromMap(from, to) {
        if (!this.distanceMap.has('' + to)) {
            this.distanceMap.set('' + to, new Map());
        }
        const subMap = this.distanceMap.get('' + to);
        if (!subMap.has('' + from)) {
            subMap.set('' + from, from.getRangeTo(to));
            statistics_1.stats.metric('Distances::miss', 1);
        }
        else {
            statistics_1.stats.metric('Distances::hit', 1);
        }
        return subMap.get('' + from);
    }
}
class Data extends BaseData {
    constructor() {
        super(...arguments);
        this.creepLists = new util_1.Temporal(() => ({}));
        this.creeps = new cache_ttl_adaptive_1.ATTL(() => (Object.keys(Game.creeps) || []).map(n => Game.creeps[n]));
        this.minerCreeps = new cache_ttl_adaptive_1.ATTL(() => this.creeps.get().filter(c => c.memory.role === 'miner'));
        this.carryCreeps = new cache_ttl_adaptive_1.ATTL(() => this.creeps.get().filter(c => c.memory.role === 'carry'));
        this.generalCreeps = new cache_ttl_adaptive_1.ATTL(() => this.creeps.get().filter(c => c.memory.role === 'general'));
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
        this.sources = new cache_ttl_adaptive_1.ATTL(() => this.room.find(FIND_SOURCES));
        this.spawns = new cache_ttl_adaptive_1.ATTL(() => this.findMy(STRUCTURE_SPAWN));
        this.containers = new cache_ttl_adaptive_1.ATTL(() => this.find(FIND_STRUCTURES, [STRUCTURE_CONTAINER]));
        this.storage = new cache_ttl_adaptive_1.ATTL(() => this.room.storage);
        this.containerOrStorage = new cache_ttl_adaptive_1.ATTL(() => !!this.room.storage ? [...this.containers.get(), this.room.storage] : this.containers.get());
        this.extensions = new cache_ttl_adaptive_1.ATTL(() => this.findMy(STRUCTURE_EXTENSION));
        this.extensionOrSpawns = new cache_ttl_adaptive_1.ATTL(() => this.concat(this.extensions, this.spawns));
        this.towers = new cache_ttl_adaptive_1.ATTL(() => this.findMy(STRUCTURE_TOWER));
        this.ramparts = new cache_ttl_adaptive_1.ATTL(() => this.findMy(STRUCTURE_RAMPART));
        this.walls = new cache_ttl_adaptive_1.ATTL(() => this.find(FIND_STRUCTURES, [STRUCTURE_WALL]));
        this.roads = new cache_ttl_adaptive_1.ATTL(() => this.find(FIND_STRUCTURES, [STRUCTURE_ROAD]));
        this.miningFlags = new cache_ttl_adaptive_1.ATTL(() => this.room.find(FIND_FLAGS, { filter: (flag) => flag.memory.role === 'mine' } || []));
        this.containerConstructions = new cache_ttl_adaptive_1.ATTL(() => this.find(FIND_MY_CONSTRUCTION_SITES, [STRUCTURE_CONTAINER]));
        this.nonDefensiveStructures = new cache_ttl_adaptive_1.ATTL(() => this.room.find(FIND_STRUCTURES)
            .filter(s => s.structureType !== STRUCTURE_WALL)
            .filter(s => s.structureType !== STRUCTURE_RAMPART));
        this.creeps = new cache_ttl_adaptive_1.ATTL(() => (Object.keys(Game.creeps) || []).map(n => Game.creeps[n]).filter(c => c.room.name === this.room.name));
        this.minerCreeps = new cache_ttl_adaptive_1.ATTL(() => this.creeps.get().filter(c => c.memory.role === 'miner'));
        this.carryCreeps = new cache_ttl_adaptive_1.ATTL(() => this.creeps.get().filter(c => c.memory.role === 'carry'));
        this.generalCreeps = new cache_ttl_adaptive_1.ATTL(() => this.creeps.get().filter(c => c.memory.role === 'general'));
        this.fillableCreeps = new cache_ttl_adaptive_1.ATTL(() => this.creeps.get()
            .filter(creep => creep.memory.role !== 'miner')
            .filter(creep => creep.memory.role !== 'carry'));
    }
    find(where, types) {
        return this.room.find(where, { filter: (s) => types.indexOf(s.structureType) > -1 }) || [];
    }
    findMy(type) { return this.find(FIND_MY_STRUCTURES, [type]); }
    concat(first, second) {
        return [].concat(first.get(), second.get());
    }
}
exports.RoomData = RoomData;
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
            if (!serializedPath.startsWith('' + from.x + from.y)) {
                console.log("path bug:", from, to, serializedPath, ...path.map(p => '' + p.x + p.y));
            }
            this.store.set(key, serializedPath);
            statistics_1.stats.metric('PathStore::miss', 1);
        }
        else {
            statistics_1.stats.metric('PathStore::hit', 1);
        }
        return this.store.get(key);
    }
    renewPath(from, to) {
        statistics_1.stats.metric('PathStore::renew', 1);
        const key = this.getDistanceKey(from, to);
        this.store.delete(key);
        return this.getPath(from, to);
    }
}
exports.data = new Data();
exports.cachedData = new CachedData();
exports.pathStore = new PathStore();
