import { roomManager } from './room';
import { findStructures } from './util';

export class CreepType {
  public readonly cost: number;
  constructor(public name: string, public body: string[]) {
    this.cost = this.body.map(p => BODYPART_COST[p]).reduce((a, c) => a + c, 0);
  }
}

class MinerCreep extends CreepType {
  constructor(lvl: number) {
    const body = [];
    for (let i = 0; i < lvl; i++){
      body.push(WORK);
    }
    body.push(CARRY);
    body.push(MOVE);
    super('miner', body);
  }
}

class CarryCreep extends CreepType {
  constructor(lvl: number) {
    const body = []
    for (let i = 0; i < lvl; i++){
      body.push(CARRY);
      body.push(MOVE);
    }
    super('carry', body);
  }
}

export class SpawnManager {
  private maxCreepCount = 13;

  private creepTypes = [
    new CreepType('general', [WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]),
    new CreepType('general', [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]),
    new CreepType('general', [WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]),
    new CreepType('general', [WORK, WORK, CARRY, MOVE, MOVE, MOVE]),
    new CreepType('general', [WORK, CARRY, CARRY, MOVE, MOVE]),
    new CreepType('general', [WORK, CARRY, MOVE])
  ];

  private minerCreepTypes = [1,2,3,4,5,6,7,8].map((v, idx) => new MinerCreep(8 - idx));
  private carryCreepTypes = [1, 2, 3, 4, 5].map((v, idx) => new CarryCreep(5 - idx));

  private creeps: Creep[];

  public loop() {
    this.creeps = Object.keys(Game.creeps).map(n => Game.creeps[n]);

    for (let name in Game.spawns) {
      const spawn = Game.spawns[name];
      const extensionEnergy = this.getEnergyInExtensions(spawn);
      if (spawn.spawning) {
        continue;
      }
      const roomCreeps = this.getCreepsByRoom(spawn.room);
      if (this.buildMinersAndCarriers(spawn, roomCreeps, extensionEnergy)) {
        continue;
      };

      this.spawnGeneralCreep(spawn, extensionEnergy);
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

  private spawnGeneralCreep(spawn: Spawn, energyInExtensions: number) {
    if (spawn.spawning) {
      return;
    }
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

  private buildMinersAndCarriers(spawn: Spawn, creeps: Creep[], energyInExtensions: number) {
    const miningFlags = roomManager.getMiningFlags(spawn.room);
    if (!miningFlags.length) {
      return true;
    }
    const maxMiners = Math.min(5, roomManager.getMiningFlags(spawn.room).length);
    const minerCreeps = creeps.filter(c => c.memory.role === 'miner');
    const carryCreeps = creeps.filter(c => c.memory.role === 'carry');

    console.log('maxMiner', maxMiners, minerCreeps.length, carryCreeps.length);

    if (minerCreeps.length === maxMiners && carryCreeps.length >= maxMiners) {
      return false;
    }

    let toBuildType: CreepType[];
    const moreOrEqualMinersThanCarrys = minerCreeps.length <= carryCreeps.length;
    const noMaxMiners = minerCreeps.length < maxMiners;
    const noContainer = !findStructures(spawn.room, [STRUCTURE_CONTAINER], FIND_STRUCTURES).length;
    if (moreOrEqualMinersThanCarrys && noMaxMiners || noContainer) {
      toBuildType = this.minerCreepTypes;
      console.log('Build: miner');
    } else {
      toBuildType = this.carryCreepTypes;
      console.log('Build: carry');
    }

    const affordableLevel = toBuildType.filter(c => (spawn.energy + energyInExtensions) > c.cost)[0];
    if (affordableLevel) {
      spawn.createCreep(affordableLevel.body, undefined, { role: affordableLevel.name });
      return true;
    } else {
      return false;
    }
  }

  private getCreepsByRoom(room: Room) {
    return this.creeps.filter(c => c.room === room);
  }
}

export const spawnManager = new SpawnManager();
