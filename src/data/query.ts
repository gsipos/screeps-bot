const hasMemoryRole = (role: string) => (item: { memory: any }) =>
  item.memory.role === role;

const notInMemoryRole = (role: string) => (item: { memory: any }) =>
  item.memory.role !== role;

export class GameQueries {
  creeps = () => (Object.keys(Game.creeps) || []).map(n => Game.creeps[n]);
  minerCreeps = () => this.creeps().filter(hasMemoryRole("miner"));
  carryCreeps = () => this.creeps().filter(hasMemoryRole("carry"));
  generalCreeps = () => this.creeps().filter(hasMemoryRole("general"));
}

export class RoomQueries {
  constructor(private room: Room) {}

  sources = () => this.room.find<Source>(FIND_SOURCES);

  spawns = () => this.findMy<Spawn>(STRUCTURE_SPAWN);

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

  nonDefensiveStructures = () =>
    this.room
      .find<Structure>(FIND_STRUCTURES)
      .filter(s => s.structureType !== STRUCTURE_WALL)
      .filter(s => s.structureType !== STRUCTURE_RAMPART);

  creeps = () =>
    (Object.keys(Game.creeps) || [])
      .map(n => Game.creeps[n])
      .filter(c => c.room.name === this.room.name);

  minerCreeps = () => this.creeps().filter(hasMemoryRole("miner"));
  carryCreeps = () => this.creeps().filter(hasMemoryRole("carry"));
  generalCreeps = () => this.creeps().filter(hasMemoryRole("general"));
  fillableCreeps = () =>
    this.creeps()
      .filter(notInMemoryRole("miner"))
      .filter(notInMemoryRole("carry"));

  private find = <T>(where: number, types: string[]) =>
    this.room.find<T>(where, {
      filter: (s: Structure) => types.includes(s.structureType)
    }) || [];

  private findMy = <T>(type: string) =>
    this.find<T>(FIND_MY_STRUCTURES, [type]);
}
