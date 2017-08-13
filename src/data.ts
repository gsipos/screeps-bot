import { TTL, Temporal } from './util';
import { ATTL } from './cache.ttl.adaptive';

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
      delete Memory[this.store][key];
    }
  }
}

interface TTLEntry<T = string> { entry: T; maxAge: number };
class TTLCache<T=string> {
  public cache: HashObject<TTLEntry<T>> = {};

  public has(key: string): boolean {
    const entry = this.cache[key];
    return !!entry && entry.maxAge < Game.time;
  }

  public get(key: string): T {
    return this.cache[key].entry;
  }

  public set(key: string, value: T, ttl: number) {
    this.cache[key] = { entry: value, maxAge: Game.time + ttl };
  }
}

class BaseData {
  public storeHit: number = 0;
  public storeMiss: number = 0;

  protected storeTo<T>(key: string, cache: HashObject<T>, func: () => T): T {
    if (!cache[key]) {
      cache[key] = func();
      this.storeMiss++;
    } else {
      this.storeHit++;
    }
    return cache[key];
  }

  protected storeTTL<T>(key: string, cache: TTLCache<T>, supplier: () => T, ttl: number): T {
    if (!cache.has(key)) {
      cache.set(key, supplier(), ttl);
      this.storeMiss++;
    } else {
      this.storeHit++;
    }
    return cache.get(key);
  }

  protected getDistanceKey(from: RoomPosition, to: RoomPosition) {
    return `${from.roomName}|${from.x}:${from.y}|${to.x}:${to.y}`;
  }
}

class CachedData extends BaseData {
  private distances: HashObject<number> = {};

  private distanceMap: WeakMap<RoomPosition, WeakMap<RoomPosition, number>> = new WeakMap();

  public getDistance(from: RoomPosition, to: RoomPosition): number {
    const key = this.getDistanceKey(from, to);
    return this.storeTo(key, this.distances, () => from.getRangeTo(to));
  }

  public getDistanceFromMap(from: RoomPosition, to: RoomPosition) {
    if (!this.distanceMap.has(to)) {
      this.distanceMap.set(to, new WeakMap());
    }
    const subMap = this.distanceMap.get(to) as WeakMap<RoomPosition, number>;
    if (!subMap.has(from)) {
      subMap.set(from, from.getRangeTo(to));
      this.storeMiss++;
    } else {
      this.storeHit++;
    }
    return subMap.get(from);
  }
}

class Data extends BaseData {
  private creepLists = new Temporal<HashObject<Creep[]>>(() => ({ }));

  private cacheCreepList(key: string, func: () => Creep[]): Creep[] {
    return this.storeTo(key, this.creepLists.get(), func);
  }

  public creeps = new Temporal(() => (Object.keys(Game.creeps) || []).map(n => Game.creeps[n]));
  public minerCreeps = new Temporal(() => this.creeps.get().filter(c => c.memory.role === 'miner'));
  public carryCreeps = new Temporal(() => this.creeps.get().filter(c => c.memory.role === 'carry'));
  public generalCreeps = new Temporal(() => this.creeps.get().filter(c => c.memory.role === 'general'));

  public creepsByJobTarget(job: string, jobTarget: string) {
    return this.cacheCreepList(job + '|' + jobTarget,() => this.creeps.get().filter(c => c.memory.job === job && c.memory.jobTarget === jobTarget));
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

  public sources =    new ATTL( () => this.room.find<Source>(FIND_SOURCES));
  public spawns =     new ATTL( () => this.findMy<Spawn>(STRUCTURE_SPAWN));
  public containers = new ATTL( () => this.find<Container>(FIND_STRUCTURES, [STRUCTURE_CONTAINER]));
  public storage =    new ATTL( () => this.room.storage);
  public containerOrStorage = new ATTL( () => !!this.room.storage ? [...this.containers.get(),  this.room.storage]: this.containers.get());
  public extensions = new ATTL( () => this.findMy<Extension>(STRUCTURE_EXTENSION));
  public extensionOrSpawns = new ATTL( () => this.concat(this.extensions, this.spawns));
  public towers =     new ATTL( () => this.findMy<Tower>(STRUCTURE_TOWER));
  public ramparts =   new ATTL( () => this.findMy<Rampart>(STRUCTURE_RAMPART));
  public walls =      new ATTL( () => this.find<StructureWall>(FIND_STRUCTURES, [STRUCTURE_WALL]));
  public roads = new ATTL( () => this.find<StructureRoad>(FIND_STRUCTURES, [STRUCTURE_ROAD]));
  public miningFlags = new ATTL( () => this.room.find<Flag>(FIND_FLAGS, { filter: (flag: Flag) => flag.memory.role === 'mine' } || []));
  public containerConstructions = new ATTL( () => this.find<ConstructionSite>(FIND_MY_CONSTRUCTION_SITES, [STRUCTURE_CONTAINER]));

  public nonDefensiveStructures = new ATTL( () => this.room.find<Structure>(FIND_STRUCTURES)
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

  public renewed = 0;

  public getPath(from: RoomPosition, to: RoomPosition) {
    const key = this.getDistanceKey(from, to);

    if (!this.store.has(key)) {
      const path = from.findPathTo(to);
      const serializedPath = Room.serializePath(path);
      this.store.set(key, serializedPath);
      this.storeMiss++;
    } else {
      this.storeHit++;
    }
    return this.store.get(key);
  }

  public renewPath(from: RoomPosition, to: RoomPosition) {
    this.renewed++;
    const key = this.getDistanceKey(from, to);
    this.store.delete(key);
    return this.getPath(from, to);
  }

}

export const data = new Data();
export const cachedData = new CachedData();
export const pathStore = new PathStore();
