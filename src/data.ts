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

  public getDistance(from: RoomPosition, to: RoomPosition): number {
    const key = this.getDistanceKey(from, to);
    return this.storeTo(key, this.distances, () => from.getRangeTo(to));
  }
}

class Data extends BaseData {
  private roomData: HashObject<HashObject<any>> = {};
  private roomDataTTL: HashObject<TTLCache<any>> = {};
  private creepLists: HashObject<Creep[]> = {};


  public reset() {
    this.roomData = {};
    this.creepLists = {};
  }

  private cacheByRoom<T>(room: Room, key: string, func: () => T): T {
    if (!this.roomData[room.name]) {
      this.roomData[room.name] = {};
    }
    return this.storeTo(key, this.roomData[room.name], func);
  }

  private cacheByRoomTTL<T>(room: Room, key: string, func: () => T, ttl: number): T {
    if (!this.roomDataTTL[room.name]) {
      this.roomDataTTL[room.name] = new TTLCache<any>();
    }
    return this.storeTTL(key, this.roomDataTTL[room.name], func, ttl);
  }

  private cacheCreepList(key: string, func: () => Creep[]): Creep[] {
    return this.storeTo(key, this.creepLists, func);
  }

  public roomMiningFlags(room: Room) {
    return this.cacheByRoom(room, 'miningFlags', () => room.find<Flag>(FIND_FLAGS, { filter: (flag: Flag) => flag.memory.role === 'mine' }));
  }


  public findStructures<T>(room: Room, types: string[], where: number = FIND_MY_STRUCTURES, ttl = 0) {
    const roomFindWhere = () => room.find<T>(where, { filter: (s: Structure) => types.indexOf(s.structureType) > -1 });
    const key = types.join('|') + where;
    if (ttl > 0) {
      return this.cacheByRoomTTL(room, key, roomFindWhere, ttl)
    } else {
      return this.cacheByRoom(room, key, roomFindWhere);
    }
  }

  public roomContainers(room: Room) {
    return this.findStructures<Container>(room, [STRUCTURE_CONTAINER], FIND_STRUCTURES);
  }

  public roomContainerConstruction(room: Room) {
    return this.findStructures<ConstructionSite>(room, [STRUCTURE_CONTAINER], FIND_MY_CONSTRUCTION_SITES);
  }

  public roomContainerContructionChanged(room: Room) {
    delete this.roomData[room.name][STRUCTURE_CONTAINER + FIND_MY_CONSTRUCTION_SITES];
  }

  public roomContainerOrStorage(room: Room) {
    return this.findStructures<Container | Storage>(room, [STRUCTURE_CONTAINER, STRUCTURE_STORAGE], FIND_STRUCTURES, 3);
  }

  public roomExtensionOrSpawn(room: Room) {
    return this.findStructures<Extension | Spawn>(room, [STRUCTURE_EXTENSION, STRUCTURE_SPAWN], FIND_MY_STRUCTURES, 3);
  }

  public roomExtensions(room: Room) {
    return this.findStructures<Extension>(room, [STRUCTURE_EXTENSION], FIND_MY_STRUCTURES, 3);
  }

  public roomTower(room: Room) {
    return this.findStructures<Tower>(room, [STRUCTURE_TOWER], FIND_MY_STRUCTURES, 7);
  }

  public roomRoad(room: Room) {
    return this.findStructures<StructureRoad>(room, [STRUCTURE_ROAD], FIND_STRUCTURES, 10);
  }

  public roomWall(room: Room) {
    return this.findStructures<StructureWall>(room, [STRUCTURE_WALL], FIND_STRUCTURES, 5);
  }

  public roomRampart(room: Room) {
    return this.findStructures<Rampart>(room, [STRUCTURE_RAMPART], FIND_MY_STRUCTURES, 7);
  }

  public creepList(): Creep[] {
    return this.cacheCreepList('all', () => Object.keys(Game.creeps).map(n => Game.creeps[n]));
  }

  public creepByRole(role: string) {
    return this.cacheCreepList(role, () => this.creepList().filter(c => c.memory.role === role));
  }

  public roomCreeps(room: Room): Creep[] {
    return this.cacheByRoom(room, 'creeps', () => this.creepList().filter(c => c.room === room));
  }

  public roomCreepsByRole(room: Room, role: string) {
    return this.cacheByRoom(room, 'creeps' + role, () => this.creepByRole(role).filter(c => c.room === room));
  }

  public creepsByJobTarget(job: string, jobTarget: string) {
    return this.cacheCreepList(job + '|' + jobTarget,() => this.creepList().filter(c => c.memory.job === job && c.memory.jobTarget === jobTarget));
  }

  public registerCreepJob(creep: Creep) {
    this.creepsByJobTarget(creep.memory.job, creep.memory.jobTarget).push(creep);
  }

}

class PathStore extends BaseData {
  private store = new MemoryStore('pathStore');

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
    const key = this.getDistanceKey(from, to);
    this.store.delete(key);
    return this.getPath(from, to);
  }

}

export const data = new Data();
export const cachedData = new CachedData();
export const pathStore = new PathStore();
