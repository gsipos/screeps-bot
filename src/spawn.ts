import { data } from './data/data';
import { Profile } from './telemetry/profiler';
import { forEachRoom } from './util';

const mapToCost = (p: string) => BODYPART_COST[p];
const sum = (a: number, b: number) => a + b;

export class CreepType {
  public readonly cost: number;
  constructor(public name: string, public body: string[]) {
    this.cost = this.body.map(mapToCost).reduce(sum, 0);
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

class GeneralCreep extends CreepType {
  constructor(lvl: number) {
    const body = [];
    for (let i = 0; i < lvl; i++) {
      body.push(WORK);
      body.push(CARRY);
      body.push(MOVE);
    }
    super('general', body);
  }
}

export class SpawnManager {
  private generalCreepCount = 1;
  private carryCreepCount = 6;

  private generalCreepTypes = [1, 2, 3, 4, 5, 6,7,8,9,10,11,12,13,14,15].map((v, idx) => new GeneralCreep(15 - idx));
  private minerCreepTypes = [1,2,3,4,5,6].map((v, idx) => new MinerCreep(6 - idx));
  private carryCreepTypes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((v, idx) => new CarryCreep(20 - idx));


  @Profile('Spawn')
  public loop() {
    forEachRoom(room => {
      const roomData = data.of(room);
      const spawns = roomData.spawns.get();
      const availableSpawns = spawns.filter(this.notSpawning);
      if (availableSpawns.length === 0) {
        return;
      }
      const spawnables: CreepType[][] = [];
      roomData.minerCreeps.clear();
      const spawnMiner = roomData.minerCreeps.get().length < roomData.sources.get().length;
      if (spawnMiner) {
        console.log('Spawn: miner', roomData.minerCreeps.get().length, roomData.sources.get().length);
        spawnables.push(this.minerCreepTypes);
        roomData.minerCreeps.clear();
      }
      if (roomData.carryCreeps.get().length < this.carryCreepCount) {
        spawnables.push(this.carryCreepTypes);
        roomData.carryCreeps.clear();
      }
      if (roomData.generalCreeps.get().length < this.generalCreepCount) {
        spawnables.push(this.generalCreepTypes);
        roomData.generalCreeps.clear();
      }
      availableSpawns.forEach(spawn => {
        const types = spawnables.shift();
        if (types) {
          const creep = types.find(c => spawn.canCreateCreep(c.body) === OK);
          if (creep) {
            const newName = spawn.createCreep(creep.body, undefined, { role: creep.name });
            console.log('Spawning new ' + creep.name + ' ' + newName);
            this.showSpawningLabel(spawn);
            return;
          }
        }
      });

    });
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

  private notSpawning = (s:StructureSpawn) => !s.spawning;

}

export const spawnManager = new SpawnManager();
