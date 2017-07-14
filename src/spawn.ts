import { roomManager } from './room';

export class CreepType {
  public readonly cost: number;
  constructor(public name: string, public body: string[]) {
    this.cost = this.body.map(p => BODYPART_COST[p]).reduce((a, c) => a + c, 0);
  }
}

class MinerCreep extends CreepType {
  constructor(lvl: number) {
    const body = new Array(lvl).map<string>(x => WORK).concat([CARRY, MOVE]);
    super('miner', body);
  }
}

class CarryCreep extends CreepType {
  constructor(lvl: number) {
    const carryPart = new Array(lvl).map<string>(x => CARRY);
    const movePart = new Array(lvl).map<string>(x => MOVE);
    const body = carryPart.concat(movePart);
    super('carry', body);
  }
}

export class SpawnManager {
  private maxCreepCount = 15;

  private creepTypes = [
    new CreepType('superior_worker', [WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]),
    new CreepType('general_lvl5', [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]),
    new CreepType('general_lvl4', [WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]),
    new CreepType('general_lvl3', [WORK, WORK, CARRY, MOVE, MOVE, MOVE]),
    new CreepType('general_lvl2', [WORK, CARRY, CARRY, MOVE, MOVE]),
    new CreepType('general_lvl1', [WORK, CARRY, MOVE])
  ];

  private minerCreepTypes = new Array(8).map((v, idx) => new MinerCreep(8 - idx));
  private carryCreepTypes = new Array(5).map((v, idx) => new CarryCreep(5 - idx));

  private creeps: Creep[];

  public loop() {
    this.creeps = Object.keys(Game.creeps).map(n => Game.creeps[n]);

    for (let name in Game.spawns) {
      const spawn = Game.spawns[name];
      if (spawn.spawning) {
        continue;
      }
      const roomCreeps = this.getCreepsByRoom(spawn.room);
      if (this.buildMinersAndCarriers(spawn, roomCreeps)) {
        continue;
      };

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

  private buildMinersAndCarriers(spawn: Spawn, creeps: Creep[]) {
    const maxMiners = Math.min(5, roomManager.getMiningFlags(spawn.room).length);
    const minerCreeps = creeps.filter(c => c.memory.role === 'miner');
    const carryCreeps = creeps.filter(c => c.memory.role === 'carry');

    if (minerCreeps.length === maxMiners || carryCreeps.length >= maxMiners) {
      return false;
    }

    let toBuildType: CreepType[];
    if (minerCreeps.length <= carryCreeps.length && minerCreeps.length < maxMiners) {
      toBuildType = this.minerCreepTypes;
    } else {
      toBuildType = this.carryCreepTypes;
    }

    const affordableLevel = toBuildType.filter(t => spawn.canCreateCreep(t.body))[0];
    if (affordableLevel) {
      spawn.createCreep(affordableLevel.body, undefined, { role: affordableLevel.name });
    }
    return true;
  }

  private getCreepsByRoom(room: Room) {
    return this.creeps.filter(c => c.room === room);
  }
}

export const spawnManager = new SpawnManager();
