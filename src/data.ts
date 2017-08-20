import { TTL, Temporal } from './util';
import { stats } from './statistics';
import { ATTL, ArrayAdaptiveTTLCache } from './cache.ttl.adaptive';

type HashObject<T> = { [idx: string]: T };

class MemoryStore<T = string> {
  constructor(private store: string) {
    if (!Memory[store]) {
      Memory[store] = {};
    }
  }

  public has(key: string): boolean {
    return !!Memory[this.store][key];
  }

  public get(key: string): T {
    return Memory[this.store][key];
  }

  public set(key: string, value: T) {
    Memory[this.store][key] = value;
  }

  public delete(key: string) {
    if (Memory[this.store]) {
      Memory[this.store][key] = undefined;
    }
  }
}

class BaseData {

  protected storeTo<T>(key: string, cache: HashObject<T>, func: () => T): T {
    if (!cache[key]) {
      cache[key] = func();
    } else {
    }
    return cache[key];
  }

  protected getDistanceKey(from: RoomPosition, to: RoomPosition) {
    return `${from.roomName}|${from.x}:${from.y}|${to.x}:${to.y}`;
  }
}

class CachedData {
  private distanceMap: Map<string, Map<string, number>> = new Map();

  public getDistanceFromMap(from: RoomPosition, to: RoomPosition) {
    if (!this.distanceMap.has(''+to)) {
      this.distanceMap.set(''+to, new Map());
    }
    const subMap = this.distanceMap.get(''+to) as Map<string, number>;
    if (!subMap.has(''+from)) {
      subMap.set(''+from, from.getRangeTo(to));
      stats.metric('Distances::miss', 1);
    } else {
      stats.metric('Distances::hit', 1);
    }
    return subMap.get(''+from);
  }
}

class Data extends BaseData {
  private creepLists = new Temporal<HashObject<Creep[]>>(() => ({}));

  private creepsByJob: HashObject<Temporal<Creep[]>> = { };

  private cacheCreepList(key: string, func: () => Creep[]): Creep[] {
    return this.storeTo(key, this.creepLists.get(), func);
  }

  public creeps = new Temporal(() => (Object.keys(Game.creeps) || []).map(n => Game.creeps[n]));
  public minerCreeps = new Temporal(() => this.creeps.get().filter(c => c.memory.role === 'miner'));
  public carryCreeps = new Temporal(() => this.creeps.get().filter(c => c.memory.role === 'carry'));
  public generalCreeps = new Temporal(() => this.creeps.get().filter(c => c.memory.role === 'general'));

  public creepsByJobTarget(job: string, jobTarget: string) {
    const getCreeps = () => this.creeps.get().filter(c => c.memory.job === job && c.memory.jobTarget === jobTarget);
    return this.storeTo(job + '|' + jobTarget, this.creepsByJob, () => new Temporal(getCreeps)).get();
  }

  public registerCreepJob(creep: Creep) {
    this.creepsByJobTarget(creep.memory.job, creep.memory.jobTarget).push(creep);
  }

  private rooms: { [roomName: string]: RoomData } = {};
  public of(room: Room) {
    if (!this.rooms[room.name]) {
      this.rooms[room.name] = new RoomData(room);
    }
    return this.rooms[room.name]
  }

}

interface ValueWrapper<T> {
  get(): T;
}

export class RoomData {
  constructor(private room: Room) { }

  public find<T>(where: number, types: string[]): T[] {
    return this.room.find<T>(where, { filter: (s: Structure) => types.indexOf(s.structureType) > -1 }) || [];
  }

  public findMy<T>(type: string) { return this.find<T>(FIND_MY_STRUCTURES, [type]); }

  private concat<F, S>(first: ValueWrapper<F[]>, second: ValueWrapper<S[]>): (F|S)[] {
    return ([] as (F | S)[]).concat(first.get(), second.get());
  }

  public sources = new Temporal( () => this.room.find<Source>(FIND_SOURCES));
  public spawns = new Temporal( () => this.findMy<Spawn>(STRUCTURE_SPAWN));
  public containers = new Temporal( () => this.find<Container>(FIND_STRUCTURES, [STRUCTURE_CONTAINER]));
  public storage = new Temporal( () => this.room.storage);
  public containerOrStorage = new Temporal( () => !!this.room.storage ? [...this.containers.get(),  this.room.storage]: this.containers.get());
  public extensions = new Temporal( () => this.findMy<Extension>(STRUCTURE_EXTENSION));
  public extensionOrSpawns = new Temporal( () => this.concat(this.extensions, this.spawns));
  public towers = new Temporal( () => this.findMy<Tower>(STRUCTURE_TOWER));
  public ramparts = new Temporal( () => this.findMy<Rampart>(STRUCTURE_RAMPART));
  public walls = new Temporal( () => this.find<StructureWall>(FIND_STRUCTURES, [STRUCTURE_WALL]));
  public roads = new Temporal( () => this.find<StructureRoad>(FIND_STRUCTURES, [STRUCTURE_ROAD]));
  public miningFlags = new Temporal( () => this.room.find<Flag>(FIND_FLAGS, { filter: (flag: Flag) => flag.memory.role === 'mine' } || []));
  public containerConstructions = new Temporal( () => this.find<ConstructionSite>(FIND_MY_CONSTRUCTION_SITES, [STRUCTURE_CONTAINER]));

  public nonDefensiveStructures = new Temporal( () => this.room.find<Structure>(FIND_STRUCTURES)
    .filter(s => s.structureType !== STRUCTURE_WALL)
    .filter(s => s.structureType !== STRUCTURE_RAMPART));

  public creeps = new Temporal(() => (Object.keys(Game.creeps) || []).map(n => Game.creeps[n]).filter(c => c.room.name === this.room.name));
  public minerCreeps = new Temporal(() => this.creeps.get().filter(c => c.memory.role === 'miner'));
  public carryCreeps = new Temporal(() => this.creeps.get().filter(c => c.memory.role === 'carry'));
  public generalCreeps = new Temporal(() => this.creeps.get().filter(c => c.memory.role === 'general'));
  public fillableCreeps = new Temporal(() => this.creeps.get()
    .filter(creep => creep.memory.role !== 'miner')
    .filter(creep => creep.memory.role !== 'carry'));
}

class PathStore extends BaseData {
  private store = new MemoryStore('pathStore');

  public getPath(room: Room, from: RoomPosition, to: RoomPosition) {
    const key = this.getDistanceKey(from, to);

    if (!this.store.has(key)) {
      const path = room.findPath(from, to, {
        serialize: true,
        ignoreCreeps: true
      });
      this.store.set(key, path as any);
      stats.metric('PathStore::miss', 1);
    } else {
      stats.metric('PathStore::hit', 1);
    }
    return this.store.get(key);
  }

  public renewPath(room:Room, from: RoomPosition, to: RoomPosition) {
    stats.metric('PathStore::renew', 1);
    const key = this.getDistanceKey(from, to);
    this.store.delete(key);
    return this.getPath(room, from, to);
  }

}

export const data = new Data();
export const cachedData = new CachedData();
export const pathStore = new PathStore();
