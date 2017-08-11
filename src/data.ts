import { TTL, Temporal } from './util';

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

type MemoryKeyPath = (string | number)[];
class MemoryHierarchyStore<T = string> {
  constructor(private store: string) {
    if (!Memory[store]) {
      Memory[store] = {};
    }
  }

  public get(path: MemoryKeyPath): T {
    const leafKey = this.getLeafKey(path);
    const leaf = this.traversePath(path, false) as any;
    return leaf[leafKey] as T;
  }

  public set(path: MemoryKeyPath, value: T) {
    const leafKey = this.getLeafKey(path);
    const leaf = this.traversePath(path, true);
    leaf[leafKey] = value;
  }

  public has(path: MemoryKeyPath): boolean {
    return !!this.get(path);
  }

  public delete(path: MemoryKeyPath) {
    const leafKey = this.getLeafKey(path);
    const leaf = this.traversePath(path, true);
    delete leaf[leafKey];

    if (Object.keys(leaf).length === 0) {
      this.delete(path.slice(0, -1));
    }
  }

  public getKeyPath(from: RoomPosition, to: RoomPosition): MemoryKeyPath {
    return [from.roomName, '' + from.x + '|' + from.y, '' + to.x + '|' +to.y];
  }

  private getLeafKey(keys: MemoryKeyPath) {
    return keys[keys.length - 1];
  }

  private traversePath(path: MemoryKeyPath, makeWay: true): HashObject<any>
  private traversePath(path: MemoryKeyPath, makeWay: false): HashObject<any> | undefined
  private traversePath(path: MemoryKeyPath, makeWay: boolean): HashObject<any> | undefined {
    let store = Memory[this.store];
    for (let i = 0; i < path.length - 1; i++) {
      const keyPart = path[i];
      if (makeWay && !store[keyPart]) {
        store[keyPart] = {};
      } else if (!store) {
        return undefined;
      }
      store = store[keyPart];
    }
    return store;
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

  public getDistance(from: RoomPosition, to: RoomPosition): number {
    const key = this.getDistanceKey(from, to);
    return this.storeTo(key, this.distances, () => from.getRangeTo(to));
  }
}

class Data extends BaseData {
  private creepLists = new Temporal<HashObject<Creep[]>>(() => ({ }));

  private cacheCreepList(key: string, func: () => Creep[]): Creep[] {
    return this.storeTo(key, this.creepLists.get(), func);
  }

  public creeps = new Temporal(() => Object.keys(Game.creeps).map(n => Game.creeps[n]));
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

export class RoomData {
  constructor(private room: Room) { }

  public find<T>(where: number, types: string[]): T[] {
    return this.room.find(where, { filter: (s: Structure) => types.indexOf(s.structureType) > -1 });
  }

  public findMy<T>(types: string) { return this.find<T>(FIND_MY_STRUCTURES, [types]); }

  private concat<F,S>(first: TTL<F[]>, second: TTL<S[]>): (F|S)[] {
    return ([] as (F | S)[]).concat(first.get(), second.get());
  }

  public sources =    new TTL(200, () => this.room.find<Source>(FIND_SOURCES));
  public spawns =     new TTL(200, () => this.findMy<Spawn>(STRUCTURE_SPAWN));
  public containers = new TTL(0, () => this.findMy<Container>(STRUCTURE_CONTAINER));
  public storage =    new TTL(10, () => this.room.storage);
  public containerOrStorage = new TTL(10, () => [...this.containers.get(), this.room.storage]);
  public extensions = new TTL(20, () => this.findMy<Extension>(STRUCTURE_EXTENSION));
  public extensionOrSpawns = new TTL(5, () => this.concat(this.extensions, this.spawns));
  public towers =     new TTL(200, () => this.findMy<Tower>(STRUCTURE_TOWER));
  public ramparts =   new TTL(7, () => this.findMy<Rampart>(STRUCTURE_RAMPART));
  public walls =      new TTL(7, () => this.find<StructureWall>(FIND_STRUCTURES, [STRUCTURE_WALL]));
  public roads = new TTL(7, () => this.find<StructureRoad>(FIND_STRUCTURES, [STRUCTURE_ROAD]));
  public miningFlags = new TTL(200, () => this.room.find<Flag>(FIND_FLAGS, { filter: (flag: Flag) => flag.memory.role === 'mine' }));
  public containerConstructions = new TTL(3, () => this.room.find<ConstructionSite>(FIND_MY_CONSTRUCTION_SITES, [STRUCTURE_CONTAINER]));

  public nonDefensiveStructures = new TTL(100, () => this.room.find<Structure>(FIND_STRUCTURES)
    .filter(s => s.structureType !== STRUCTURE_WALL)
    .filter(s => s.structureType !== STRUCTURE_RAMPART));

  public creeps = new Temporal(() => Object.keys(Game.creeps).map(n => Game.creeps[n]).filter(c => c.room === this.room));
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
