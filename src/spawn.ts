import { data } from "./data/data";
import { Profile } from "./telemetry/profiler";
import { forEachRoom, sumReducer } from "./util";
import { needMoreCarryCreep } from "./decisions/spawn-carry-creep";
import { needMoreHarasserCreep } from "./decisions/spawn-harasser-creep";
import { needMoreRemoteMinerCreep } from "./decisions/spawn-remote-miner-creep";
import { CreepRole } from "./creep/roles";

const mapToCost = (p: string) => BODYPART_COST[p];

export class CreepType {
  public readonly cost: number;
  constructor(public name: string, public body: string[]) {
    this.cost = this.body.map(mapToCost).reduce(sumReducer, 0);
  }
}

class MinerCreep extends CreepType {
  constructor(lvl: number) {
    const body = [];
    for (let i = 0; i <= lvl; i++) {
      body.push(WORK);
    }
    body.push(CARRY);
    body.push(MOVE);
    super(CreepRole.MINER, body);
  }
}

class CarryCreep extends CreepType {
  constructor(lvl: number) {
    const body = [];
    for (let i = 0; i <= lvl; i++) {
      body.push(CARRY);
      body.push(MOVE);
    }
    super(CreepRole.CARRY, body);
  }
}

class GeneralCreep extends CreepType {
  constructor(lvl: number) {
    const body = [];
    for (let i = 0; i <= lvl; i++) {
      body.push(WORK);
      body.push(CARRY);
      body.push(MOVE);
    }
    super(CreepRole.GENERAL, body);
  }
}

class HarasserCreep extends CreepType {
  constructor(lvl: number) {
    const body = [];
    for (let i = 0; i <= lvl; i++) {
      body.push(i % 2 ? ATTACK : TOUGH, MOVE);
    }
    super(CreepRole.HARASSER, body);
  }
}

class RemoteMiner extends CreepType {
  constructor(lvl: number) {
    const body = [];
    for (let i = 0; i < lvl; i++) {
      body.push(i % 2 ? TOUGH : WORK, MOVE);
      body.push(CARRY, MOVE);
    }
    super(CreepRole.REMOTEMINER, body);
  }
}

export class SpawnManager {
  private generalCreepCount = 1;

  private generalCreepTypes = [...Array(6).keys()]
    .reverse()
    .map(lvl => new GeneralCreep(lvl));

  private minerCreepTypes = [...Array(6).keys()]
    .reverse()
    .map(lvl => new MinerCreep(lvl));

  private carryCreepTypes = [...Array(10).keys()]
    .reverse()
    .map(lvl => new CarryCreep(lvl));

  private harrasserCreepTypes = [...Array(14).keys()]
    .reverse()
    .map(lvl => new HarasserCreep(lvl));

  private remoteMinerCreepTypes = [...Array(5).keys()]
    .reverse()
    .map(lvl => new RemoteMiner(lvl));

  @Profile("Spawn")
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
      const spawnMiner =
        roomData.minerCreeps.get().length < roomData.sources.get().length;
      if (spawnMiner) {
        console.log(
          "Spawn: miner",
          roomData.minerCreeps.get().length,
          roomData.sources.get().length
        );
        spawnables.push(this.minerCreepTypes);
        roomData.minerCreeps.clear();
      }
      if (needMoreCarryCreep.of(room).get()) {
        spawnables.push(this.carryCreepTypes);
        roomData.carryCreeps.clear();
      }
      if (roomData.generalCreeps.get().length < this.generalCreepCount) {
        spawnables.push(this.generalCreepTypes);
        roomData.generalCreeps.clear();
      }
      if (needMoreHarasserCreep.of(room).get()) {
        spawnables.push(this.harrasserCreepTypes);
      }
      if (needMoreRemoteMinerCreep.of(room).get()) {
        spawnables.push(this.remoteMinerCreepTypes);
        needMoreRemoteMinerCreep.of(room).clear();
      }
      availableSpawns.forEach(spawn => {
        const types = spawnables.shift();
        if (types) {
          const creep = types.find(c => spawn.canCreateCreep(c.body) === OK);
          if (creep) {
            const newName = spawn.createCreep(creep.body, undefined, {
              role: creep.name,
              home: spawn.room.name
            });
            console.log("Spawning new " + creep.name + " " + newName);
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
        "🛠️" + spawningCreep.memory.role,
        spawn.pos.x + 1,
        spawn.pos.y,
        { align: "left", opacity: 0.8 }
      );
    }
  }

  private notSpawning = (s: StructureSpawn) => !s.spawning;
}

export const spawnManager = new SpawnManager();
