import { data } from './data';
import { Profile } from './profiler';

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
  private generalCreepCount = 3;
  private carryCreepCount = 10;

  private creepTypes = [
    new CreepType('general', [WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]),
    new CreepType('general', [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]),
    new CreepType('general', [WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE]),
    new CreepType('general', [WORK, WORK, CARRY, MOVE, MOVE, MOVE]),
    new CreepType('general', [WORK, CARRY, CARRY, MOVE, MOVE]),
    new CreepType('general', [WORK, CARRY, MOVE])
  ];

  private minerCreepTypes = [1,2,3,4,5,6,7,8].map((v, idx) => new MinerCreep(8 - idx));
  private carryCreepTypes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v, idx) => new CarryCreep(10 - idx));

  private creeps: Creep[];

  @Profile('Spawn')
  public loop() {
    this.creeps = data.creepList();

    for (let name in Game.spawns) {
      const spawn = Game.spawns[name];
      const extensionEnergy = this.getEnergyInExtensions(spawn);
      if (spawn.spawning) {
        continue;
      }
      const roomCreeps = data.roomCreeps(spawn.room);
      if (this.buildMinersAndCarriers(spawn, roomCreeps, extensionEnergy)) {
        continue;
      };

      if (this.spawnGeneralCreep(spawn, extensionEnergy, roomCreeps)) {
        continue;
      };
      if (this.spawnCarriers(spawn, extensionEnergy, roomCreeps)) {
        continue;
      };
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

  private spawnGeneralCreep(spawn: Spawn, energyInExtensions: number, roomCreeps: Creep[]) {
    const generalCreeps = data.roomCreepsByRole(spawn.room, 'general');
    if (spawn.spawning) {
      return false;
    }
    if (generalCreeps.length >= this.generalCreepCount) {
      return false;
    }
    const creep = this.creepTypes.filter(c => (spawn.energy+energyInExtensions) > c.cost)[0];
    if (creep) {
      const newName = spawn.createCreep(creep.body, undefined, { role: creep.name });
      console.log('Spawning new ' + creep.name + ' ' + newName);
      return true;
    }
  }

  private spawnCarriers(spawn: Spawn, energyInExtensions: number, roomCreeps: Creep[]): boolean {
    const carryCreeps = data.roomCreepsByRole(spawn.room, 'carry');
    if (spawn.spawning) {
      return false;
    }
    if (carryCreeps.length >= this.carryCreepCount) {
      return false;
    }
    const creep = this.carryCreepTypes.filter(c => (spawn.energy + energyInExtensions) > c.cost)[0];
    if (creep) {
      const newName = spawn.createCreep(creep.body, undefined, { role: creep.name });
      console.log('Spawning new ' + creep.name + ' ' + newName);
      return true;
    }
    return false;
  }

  private getEnergyInExtensions(spawn: Spawn) {
    return data.roomExtensions(spawn.room).reduce((a, s) => a + s.energy, 0);
  }

  private buildMinersAndCarriers(spawn: Spawn, creeps: Creep[], energyInExtensions: number) {
    const miningFlags = data.roomMiningFlags(spawn.room);
    if (!miningFlags.length) {
      return true;
    }
    const maxMiners = Math.min(5, miningFlags.length);
    const minerCreeps = data.roomCreepsByRole(spawn.room, 'miner');
    const carryCreeps = data.roomCreepsByRole(spawn.room, 'carry');

    if (minerCreeps.length >= maxMiners && carryCreeps.length >= maxMiners) {
      return false;
    }

    let toBuildType: CreepType[];
    const lessOrEqualMinersThanCarrys = minerCreeps.length <= carryCreeps.length;
    const noMaxMiners = minerCreeps.length < maxMiners;
    const noContainer = !data.roomContainers(spawn.room).length;
    if ((lessOrEqualMinersThanCarrys || noContainer) && noMaxMiners) {
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

}

export const spawnManager = new SpawnManager();
