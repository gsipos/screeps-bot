import { toArray } from "../util";
import { CreepRole } from "../creep/roles";

const hasMemoryRole = (role: string) => (item: { memory: any }) =>
  item.memory.role === role;

const notInMemoryRole = (role: string) => (item: { memory: any }) =>
  item.memory.role !== role;

export class GameQueries {
  rooms = () => toArray(Game.rooms);
  creeps = () => (Object.keys(Game.creeps) || []).map(n => Game.creeps[n]);
  minerCreeps = () => this.creeps().filter(hasMemoryRole(CreepRole.MINER));
  carryCreeps = () => this.creeps().filter(hasMemoryRole(CreepRole.CARRY));
  generalCreeps = () => this.creeps().filter(hasMemoryRole(CreepRole.GENERAL));
  harasserCreeps = () => this.creeps().filter(hasMemoryRole(CreepRole.HARASSER));
  remoteMinerCreeps = () => this.creeps().filter(hasMemoryRole(CreepRole.REMOTEMINER));
}

export class RoomQueries {
  constructor(private room: Room) {}

  sources = () => this.room.find<Source>(FIND_SOURCES);

  spawns = () => this.findMy<Spawn>(STRUCTURE_SPAWN);

  constructions = () => this.room.find<ConstructionSite>(FIND_MY_CONSTRUCTION_SITES);

  containers = () =>
    this.find<Container>(FIND_STRUCTURES, [STRUCTURE_CONTAINER]);

  containerOrStorage = () =>
    !!this.room.storage
      ? [...this.containers(), this.room.storage]
      : this.containers();

  extensions = () => this.findMy<Extension>(STRUCTURE_EXTENSION);

  extensionOrSpawns = () => [...this.extensions(), ...this.spawns()];

  towers = () => this.findMy<Tower>(STRUCTURE_TOWER);
  ramparts = () => this.findMy<Rampart>(STRUCTURE_RAMPART);
  walls = () => this.find<StructureWall>(FIND_STRUCTURES, [STRUCTURE_WALL]);
  roads = () => this.find<StructureRoad>(FIND_STRUCTURES, [STRUCTURE_ROAD]);

  miningFlags = () =>
    this.room.find<Flag>(FIND_FLAGS, { filter: hasMemoryRole("mine") } || []);

  containerConstructions = () =>
    this.find<ConstructionSite>(FIND_MY_CONSTRUCTION_SITES, [
      STRUCTURE_CONTAINER
    ]);

  hostileCreeps = () => this.room.find<Creep>(FIND_HOSTILE_CREEPS);
  hostileStructures = () => this.room.find<Structure>(FIND_HOSTILE_STRUCTURES);
  hostileTowers = () => this.find(FIND_HOSTILE_STRUCTURES, [STRUCTURE_TOWER]);

  nonDefensiveStructures = () =>
    this.room
      .find<Structure>(FIND_STRUCTURES)
      .filter(s => s.structureType !== STRUCTURE_WALL)
      .filter(s => s.structureType !== STRUCTURE_RAMPART);

  globalCreeps = () =>
    (Object.keys(Game.creeps) || []).map(n => Game.creeps[n]);

  creeps = () =>
    this.globalCreeps().filter(c => c.room.name === this.room.name);

  minerCreeps = () => this.creeps().filter(hasMemoryRole(CreepRole.MINER));
  carryCreeps = () => this.creeps().filter(hasMemoryRole(CreepRole.CARRY));
  generalCreeps = () => this.creeps().filter(hasMemoryRole(CreepRole.GENERAL));
  fillableCreeps = () =>
    this.creeps()
      .filter(hasMemoryRole(CreepRole.GENERAL));
  remoteMinerCreeps = () =>
    this.globalCreeps()
      .filter(hasMemoryRole(CreepRole.REMOTEMINER))
      .filter(c => (c.memory.home = this.room.name));

  private find = <T>(where: number, types: string[]) =>
    this.room.find<T>(where, {
      filter: (s: Structure) => types.includes(s.structureType)
    }) || [];

  private findMy = <T>(type: string) =>
    this.find<T>(FIND_MY_STRUCTURES, [type]);
}
