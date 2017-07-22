type HashObject<T> = { [idx: string]: T };

class Data {
  private roomData: HashObject<HashObject<any>> = {};
  private creepLists: HashObject<Creep[]> = {};


  public reset() {
    this.roomData = {};
    this.creepLists = {};
  }

  private storeTo<T>(key: string, cache: HashObject<T>, func: () => T): T {
    if (!cache[key]) {
      cache[key] = func();
    }
    return cache[key];
  }

  private cacheByRoom<T>(room: Room, key: string, func: () => T): T {
    if (!this.roomData[room.name]) {
      this.roomData[room.name] = {};
    }
    return this.storeTo(key, this.roomData[room.name], func);
  }

  private cacheCreepList(key: string, func: () => Creep[]): Creep[] {
    return this.storeTo(key, this.creepLists, func);
  }

  public roomMiningFlags(room: Room) {
    return this.cacheByRoom(room, 'miningFlags', () => room.find<Flag>(FIND_FLAGS, { filter: (flag: Flag) => flag.memory.role === 'mine' }));
  }

  public findStructures<T>(room: Room, types: string[], where: number = FIND_MY_STRUCTURES) {
    return this.cacheByRoom(room, types.join('|') + where, () => room.find<T>(where, { filter: (s: Structure) => types.indexOf(s.structureType) > -1 }));
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
    return this.findStructures<Container | Storage>(room, [STRUCTURE_CONTAINER, STRUCTURE_STORAGE], FIND_STRUCTURES);
  }

  public roomExtensionOrSpawn(room: Room) {
    return this.findStructures<Extension | Spawn>(room, [STRUCTURE_EXTENSION, STRUCTURE_SPAWN]);
  }

  public roomExtensions(room: Room) {
    return this.findStructures<Extension>(room, [STRUCTURE_EXTENSION]);
  }

  public roomTower(room: Room) {
    return this.findStructures<Tower>(room, [STRUCTURE_TOWER]);
  }

  public roomRoad(room: Room) {
    return this.findStructures<StructureRoad>(room, [STRUCTURE_ROAD], FIND_STRUCTURES);
  }

  public roomWall(room: Room) {
    return this.findStructures<StructureWall>(room, [STRUCTURE_WALL], FIND_STRUCTURES);
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

export const data = new Data();
