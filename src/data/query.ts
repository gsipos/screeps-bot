import { toArray } from "../util";
import { CreepRole } from "../creep/roles";
import { DataSupplier } from "./cache/temporal";
import { geographer } from "../room/geographer";

const hasMemoryRole = (role: string) => (item: { memory: any }) =>
  item.memory.role === role;

const find = <T>(room: Room, where: number, types: string[]) =>
  room.find<T>(where, {
    filter: (s: Structure) => types.includes(s.structureType)
  }) || [];

const findMy = <T>(room: Room, type: string) =>
  find<T>(room, FIND_MY_STRUCTURES, [type]);

export class GameQueries implements DataSupplier {
  [name: string]: () => any;

  rooms = () => toArray(Game.rooms);
  creeps = () => (Object.keys(Game.creeps) || []).map(n => Game.creeps[n]);
  minerCreeps = () => this.creeps().filter(hasMemoryRole(CreepRole.MINER));
  carryCreeps = () => this.creeps().filter(hasMemoryRole(CreepRole.CARRY));
  generalCreeps = () => this.creeps().filter(hasMemoryRole(CreepRole.GENERAL));
  harasserCreeps = () =>
    this.creeps().filter(hasMemoryRole(CreepRole.HARASSER));
  remoteMinerCreeps = () =>
    this.creeps().filter(hasMemoryRole(CreepRole.REMOTEMINER));
}

export class RoomQueries implements DataSupplier{
  [name: string]: (() => any) | any;

  constructor(private room: Room) {}

  sources = () => this.room.find<Source>(FIND_SOURCES);

  spawns = () => findMy<Spawn>(this.room, STRUCTURE_SPAWN);

  constructions = () =>
    this.room.find<ConstructionSite>(FIND_MY_CONSTRUCTION_SITES);

  containers = () =>
    find<Container>(this.room, FIND_STRUCTURES, [STRUCTURE_CONTAINER]);

  containerOrStorage = () =>
    !!this.room.storage
      ? [...this.containers(), this.room.storage]
      : this.containers();

  extensions = () => findMy<Extension>(this.room, STRUCTURE_EXTENSION);

  extensionOrSpawns = () => [...this.extensions(), ...this.spawns()];

  towers = () => findMy<Tower>(this.room, STRUCTURE_TOWER);
  ramparts = () => findMy<Rampart>(this.room, STRUCTURE_RAMPART);
  walls = () =>
    find<StructureWall>(this.room, FIND_STRUCTURES, [STRUCTURE_WALL]);
  roads = () =>
    find<StructureRoad>(this.room, FIND_STRUCTURES, [STRUCTURE_ROAD]);

  miningFlags = () =>
    this.room.find<Flag>(FIND_FLAGS, { filter: hasMemoryRole("mine") } || []);

  containerConstructions = () =>
    find<ConstructionSite>(this.room, FIND_MY_CONSTRUCTION_SITES, [
      STRUCTURE_CONTAINER
    ]);

  hostileCreeps = () => this.room.find<Creep>(FIND_HOSTILE_CREEPS);
  hostileStructures = () => this.room.find<Structure>(FIND_HOSTILE_STRUCTURES);
  hostileTowers = () =>
    find(this.room, FIND_HOSTILE_STRUCTURES, [STRUCTURE_TOWER]);

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
  fillableCreeps = () => this.creeps().filter(hasMemoryRole(CreepRole.GENERAL));
  remoteMinerCreeps = () =>
    this.globalCreeps()
      .filter(hasMemoryRole(CreepRole.REMOTEMINER))
      .filter(c => (c.memory.home = this.room.name));

  neighbourRooms = () => geographer.describeNeighbours(this.room);
}
