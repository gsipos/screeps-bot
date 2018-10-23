import { creepManager } from "./creep";
import { data } from "../data/data";
import { MoveToRoomCreepJob, CreepJob } from "./job/creep-job";
import { TargetSelectionPolicy } from "./job/target-selection-policy";
import { toName, succeeds } from "../util";
import { Profile } from "../telemetry/profiler";
import { geographer } from "../room/geographer";
import { hostileCreepsInRoom } from "./creep.harasser";

// moveToAnother room
// find source
// harvest
// flee from enemy
// go back
// fill source

const hasEnergy = (c: Creep) => (c.carry.energy || 0) !== 0;
const fullOfEnergy = (c: Creep) =>
  (c.carry.energy || 0) === (c.carryCapacity || 0);
const atHome = (c: Creep) => c.room.name === c.memory.home;
const inOwnedRoom = (c: Creep) => !!c.room.controller && c.room.controller.my;

const findRemoteSource = new MoveToRoomCreepJob(
  "findRemoteSource",
  "#ffffff",
  "remote",
  c => atHome(c),
  hostileCreepsInRoom,
  c =>
    data
      .of(c.room)
      .neighbourRooms.get()
      .filter(
        r =>
          r.type === "CHARTED" &&
          !r.info.enemyActivity &&
          !!r.info.sources &&
          !r.info.my
      )
      .map(toName),
  TargetSelectionPolicy.random
);

const harvest = new CreepJob(
  "remoteHarvest",
  "#ffffff",
  "Harvest",
  (c, t) => c.harvest(t),
  (c, t: Source) => [atHome(c), fullOfEnergy(c)].some(succeeds),
  c => data.of(c.room).sources.get(),
  TargetSelectionPolicy.distance
);

const goHome = new MoveToRoomCreepJob(
  "moveHome",
  "#ffffff",
  "Home",
  c => !atHome(c),
  c => false,
  c => [c.memory.home],
  TargetSelectionPolicy.inOrder
);

const fillStorage = new CreepJob(
  "fillStorage",
  "#ffffff",
  "Fill",
  (c, t: StructureStorage) => c.transfer(t, RESOURCE_ENERGY, c.carryCapacity),
  c => !atHome(c) || !hasEnergy(c),
  c => [c.room.storage],
  TargetSelectionPolicy.inOrder
);

const explore = new MoveToRoomCreepJob(
  "miner_explore",
  "#ffffff",
  "explore",
  c => atHome(c),
  c => false,
  c =>
    data
      .of(c.room)
      .neighbourRooms.get()
      .map(toName),
  TargetSelectionPolicy.inOrder
);

class RemoteMinerCreepManager {
  public remoteMinerJobs = [
    fillStorage,
    harvest,
    findRemoteSource,
    explore,
    goHome
  ];

  @Profile("RemoteMiner")
  public loop() {
    try {
      data.remoteMinerCreeps.get().forEach(this.processCreep);
    } catch (error) {
      console.log("Error in RemoteMiners", error);
    }
  }

  private processCreep = (c: Creep) =>
    creepManager.processCreep(c, this.remoteMinerJobs);
}

export const remoteMinerCreepManager = new RemoteMinerCreepManager();
