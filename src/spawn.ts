import { data } from "./data/data";
import { Profile } from "./telemetry/profiler";
import { forEachRoom } from "./util";
import { needMoreCarryCreepTree } from "./decisions/spawn-carry-creep";
import { needMoreHarasserCreepTree } from "./decisions/spawn-harasser-creep";
import { needRemoteMinerCreep } from "./decisions/spawn-remote-miner-creep";
import {
  GeneralCreep,
  MinerCreep,
  CarryCreep,
  HarasserCreep,
  RemoteMiner,
  CreepType
} from "./creep/body/creep.body";
import {
  sequence,
  condition,
  selector,
  action,
  mapState
} from "./decisions/behavior-tree/behavior-tree-builder";
import {
  FAILED,
  SUCCESS
} from "./decisions/behavior-tree/behavior-tree-status";

interface SpawnState {
  room: Room;
  spawns: Spawn[];
}

export class SpawnManager {
  private removeSpawnFromAvailables = action<SpawnState>(
    "remove spawn from availables",
    s => {
      const [x, ...remaining] = s.spawns;
      s.spawns = remaining;
      return !s.spawns.length ? SUCCESS : FAILED;
    }
  );

  private spawnTree = selector<SpawnState>("Look for spawnable creeps", [
    condition("No idle spawn", s => s.spawns.length === 0),
    sequence("Spawn miner", [
      condition(
        "less miner than source",
        s =>
          data.of(s.room).minerCreeps.get().length <
          data.of(s.room).sources.get().length
      ),
      action("spawn miner", s =>
        this.spawnType(s.spawns[0], this.minerCreepTypes)
      ),
      this.removeSpawnFromAvailables
    ]),
    sequence("Spawn general", [
      condition("no general", s => data.of(s.room).generalCreeps.get().length === 0),
      action("spawn general", s =>
        this.spawnType(s.spawns[0], this.generalCreepTypes)
      ),
      this.removeSpawnFromAvailables
    ]),
    sequence("Spawn carry", [
      mapState<SpawnState, Room>("", s => s.room, needMoreCarryCreepTree),
      action("spawn carry", s =>
        this.spawnType(s.spawns[0], this.carryCreepTypes)
      ),
      this.removeSpawnFromAvailables
    ]),
    sequence("Spawn harasser", [
      mapState<SpawnState, Room>("", s => s.room, needMoreHarasserCreepTree),
      action("spawn harasser", s =>
        this.spawnType(s.spawns[0], this.harrasserCreepTypes)
      ),
      this.removeSpawnFromAvailables
    ]),
    sequence("Spawn remoteMiner", [
      mapState<SpawnState, Room>("", s => s.room, needRemoteMinerCreep),
      action("spawn remoteMiner", s =>
        this.spawnType(s.spawns[0], this.remoteMinerCreepTypes)
      ),
      this.removeSpawnFromAvailables
    ])
  ]);

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
      const spawns = data
        .of(room)
        .spawns.get()
        .filter(this.notSpawning);
      this.spawnTree.tick({
        room,
        spawns
      });
    });
  }

  private spawnType(spawn: Spawn, types: CreepType[]) {
    const creep = types.find(c => spawn.canCreateCreep(c.body) === OK);
    if (!creep) {
      return FAILED;
    }
    const newName = spawn.createCreep(creep.body, undefined, {
      role: creep.name,
      home: spawn.room.name
    });
    if (typeof newName === "string") {
      console.log("Spawning new " + creep.name + " " + newName);
      this.showSpawningLabel(spawn);
      return SUCCESS;
    } else {
      return FAILED;
    }
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
