import { TTL, Temporal } from './util';
import { stats } from './statistics';
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
  private creepLists = new Temporal<HashObject<Creep[]>>(() => ({ }));

  private cacheCreepList(key: string, func: () => Creep[]): Creep[] {
    return this.storeTo(key, this.creepLists.get(), func);
  }

  public creeps = new ATTL(() => (Object.keys(Game.creeps) || []).map(n => Game.creeps[n]));
  public minerCreeps = new ATTL(() => this.creeps.get().filter(c => c.memory.role === 'miner'));
  public carryCreeps = new ATTL(() => this.creeps.get().filter(c => c.memory.role === 'carry'));
  public generalCreeps = new ATTL(() => this.creeps.get().filter(c => c.memory.role === 'general'));

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

  public creeps = new ATTL(() => (Object.keys(Game.creeps) || []).map(n => Game.creeps[n]).filter(c => c.room.name === this.room.name));
  public minerCreeps = new ATTL(() => this.creeps.get().filter(c => c.memory.role === 'miner'));
  public carryCreeps = new ATTL(() => this.creeps.get().filter(c => c.memory.role === 'carry'));
  public generalCreeps = new ATTL(() => this.creeps.get().filter(c => c.memory.role === 'general'));
  public fillableCreeps = new ATTL(() => this.creeps.get()
    .filter(creep => creep.memory.role !== 'miner')
    .filter(creep => creep.memory.role !== 'carry'));
}

class PathStore extends BaseData {
  private store = new MemoryStore('pathStore');

  public getPath(room: Room, from: RoomPosition, to: RoomPosition) {
    const key = this.getDistanceKey(from, to);

    if (!this.store.has(key)) {
      const path = room.findPath(from, to);

      const serializedPath = Room.serializePath(path);
      if (!serializedPath.startsWith('' + from.x + from.y)) {
        console.log("path bug:", from, to, serializedPath, ...path.map(p => ''+p.x+p.y));
      }
      this.store.set(key, serializedPath);
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
