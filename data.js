"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
const statistics_1 = require("./statistics");
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
            Memory[this.store][key] = undefined;
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
class Data extends BaseData {
    constructor() {
        super(...arguments);
        this.creepLists = new util_1.Temporal(() => ({}));
        this.creepsByJob = {};
        this.creeps = new util_1.Temporal(() => (Object.keys(Game.creeps) || []).map(n => Game.creeps[n]));
        this.minerCreeps = new util_1.Temporal(() => this.creeps.get().filter(c => c.memory.role === 'miner'));
        this.carryCreeps = new util_1.Temporal(() => this.creeps.get().filter(c => c.memory.role === 'carry'));
        this.generalCreeps = new util_1.Temporal(() => this.creeps.get().filter(c => c.memory.role === 'general'));
        this.rooms = {};
    }
    cacheCreepList(key, func) {
        return this.storeTo(key, this.creepLists.get(), func);
    }
    creepsByJobTarget(job, jobTarget) {
        const getCreeps = () => this.creeps.get().filter(c => c.memory.job === job && c.memory.jobTarget === jobTarget);
        return this.storeTo(job + '|' + jobTarget, this.creepsByJob, () => new util_1.Temporal(getCreeps)).get();
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
        this.sources = new util_1.Temporal(() => this.room.find(FIND_SOURCES));
        this.spawns = new util_1.Temporal(() => this.findMy(STRUCTURE_SPAWN));
        this.containers = new util_1.Temporal(() => this.find(FIND_STRUCTURES, [STRUCTURE_CONTAINER]));
        this.storage = new util_1.Temporal(() => this.room.storage);
        this.containerOrStorage = new util_1.Temporal(() => !!this.room.storage ? [...this.containers.get(), this.room.storage] : this.containers.get());
        this.extensions = new util_1.Temporal(() => this.findMy(STRUCTURE_EXTENSION));
        this.extensionOrSpawns = new util_1.Temporal(() => this.concat(this.extensions, this.spawns));
        this.towers = new util_1.Temporal(() => this.findMy(STRUCTURE_TOWER));
        this.ramparts = new util_1.Temporal(() => this.findMy(STRUCTURE_RAMPART));
        this.walls = new util_1.Temporal(() => this.find(FIND_STRUCTURES, [STRUCTURE_WALL]));
        this.roads = new util_1.Temporal(() => this.find(FIND_STRUCTURES, [STRUCTURE_ROAD]));
        this.miningFlags = new util_1.Temporal(() => this.room.find(FIND_FLAGS, { filter: (flag) => flag.memory.role === 'mine' } || []));
        this.containerConstructions = new util_1.Temporal(() => this.find(FIND_MY_CONSTRUCTION_SITES, [STRUCTURE_CONTAINER]));
        this.hostileCreeps = new util_1.Temporal(() => this.room.find(FIND_HOSTILE_CREEPS));
        this.nonDefensiveStructures = new util_1.Temporal(() => this.room.find(FIND_STRUCTURES)
            .filter(s => s.structureType !== STRUCTURE_WALL)
            .filter(s => s.structureType !== STRUCTURE_RAMPART));
        this.creeps = new util_1.Temporal(() => (Object.keys(Game.creeps) || []).map(n => Game.creeps[n]).filter(c => c.room.name === this.room.name));
        this.minerCreeps = new util_1.Temporal(() => this.creeps.get().filter(c => c.memory.role === 'miner'));
        this.carryCreeps = new util_1.Temporal(() => this.creeps.get().filter(c => c.memory.role === 'carry'));
        this.generalCreeps = new util_1.Temporal(() => this.creeps.get().filter(c => c.memory.role === 'general'));
        this.fillableCreeps = new util_1.Temporal(() => this.creeps.get()
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
    getPath(room, from, to) {
        const key = this.getDistanceKey(from, to);
        if (!this.store.has(key)) {
            const path = room.findPath(from, to, {
                serialize: true,
                ignoreCreeps: true
            });
            this.store.set(key, path);
            statistics_1.stats.metric('PathStore::miss', 1);
        }
        else {
            statistics_1.stats.metric('PathStore::hit', 1);
        }
        return this.store.get(key);
    }
    renewPath(room, from, to) {
        statistics_1.stats.metric('PathStore::renew', 1);
        const key = this.getDistanceKey(from, to);
        this.store.delete(key);
        return this.getPath(room, from, to);
    }
}
exports.data = new Data();
exports.pathStore = new PathStore();
