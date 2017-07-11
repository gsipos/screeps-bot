
export class CreepType {
  public readonly cost: number;
  constructor(public name: string, public body: string[]) {
    this.cost = this.body.map(p => BODYPART_COST[p]).reduce((a, c) => a + c, 0);
  }
}

export class SpawnManager {
  private maxCreepCount = 10;

  private creepTypes = [
    new CreepType('superior_worker', [WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]),
    new CreepType('general_lvl5', [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]),
    new CreepType('general_lvl4', [WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]),
    new CreepType('general_lvl3', [WORK, WORK, CARRY, MOVE, MOVE, MOVE]),
    new CreepType('general_lvl2', [WORK, CARRY, CARRY, MOVE, MOVE]),
    new CreepType('general_lvl1', [WORK, CARRY, MOVE])
  ];

  public loop() {
    for (let name in Game.spawns) {
      const spawn = Game.spawns[name];

      this.spawnCreep(spawn, this.getEnergyInExtensions(spawn));
      this.showSpawningLabel(spawn);
    }
  }

  private showSpawningLabel(spawn: Spawn) {
    if (spawn.spawning) {
      var spawningCreep = Game.creeps[spawn.spawning.name];
      spawn.room.visual.text(
        '🛠️' + spawningCreep.memory.role,
        spawn.pos.x + 1,
        spawn.pos.y,
        { align: 'left', opacity: 0.8 });
    }
  }

  private spawnCreep(spawn: Spawn, energyInExtensions: number) {
    if (Object.keys(Game.creeps).length >= this.maxCreepCount) {
      return;
    }
    const creep = this.creepTypes.filter(c => (spawn.energy+energyInExtensions) > c.cost)[0];
    if (creep) {
      const newName = spawn.createCreep(creep.body, undefined, { role: creep.name });
      console.log('Spawning new ' + creep.name + ' ' + newName);
    }
  }

  private getEnergyInExtensions(spawn: Spawn) {
    return spawn.room.find<Extension>(FIND_MY_STRUCTURES)
      .filter(s => s.structureType == STRUCTURE_EXTENSION)
      .reduce((a, s) => a + s.energy, 0);
  }
}

export const spawnManager = new SpawnManager();
