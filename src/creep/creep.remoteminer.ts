import { creepManager } from "./creep";
import { data } from "../data/data";
import { MoveToRoomCreepJob, CreepJob } from "./job/creep-job";
import { hostileCreepsInRoom } from "./creep.harasser";
import { TargetSelectionPolicy } from "./job/target-selection-policy";
import { toName } from "../util";
import { Profile } from "../telemetry/profiler";

// moveToAnother room
// find source
// harvest
// flee from enemy
// go back
// fill source

const findRemoteSource = new MoveToRoomCreepJob(
  "findRemoteSource",
  "#ffffff",
  "remote",
  hostileCreepsInRoom,
  c =>
    data
      .of(c.room)
      .neighbourRooms.get()
      .filter(
        r => r.type === "CHARTED" && !r.info.enemyActivity && r.info.sources
      )
      .map(toName),
  TargetSelectionPolicy.inOrder
);

const harvest = new CreepJob(
  "remoteHarvest",
  '#ffffff',
  'Harvest',
  (c, t) => c.harvest(t),
  (c, t: Source) => c.carry.energy === c.carryCapacity || t.energy === 0 || hostileCreepsInRoom(c),
  c => data.of(c.room).sources.get(),
  TargetSelectionPolicy.distance
);

const goHome = new MoveToRoomCreepJob(
  'moveHome',
  '#ffffff',
  'Home',
  () => false,
  c => [c.memory.home],
  TargetSelectionPolicy.inOrder
)

const fillStorage = new CreepJob(
  'fillStorage',
  '#ffffff',
  'Fill',
  (c,t: StructureStorage) => c.transfer(t, RESOURCE_ENERGY, c.carryCapacity),
  (c) => c.carry.energy === 0,
  c => [c.room.storage],
  TargetSelectionPolicy.inOrder
)


class RemoteMinerCreepManager {
  public remoteMinerJobs = [
    fillStorage,
    findRemoteSource,
    harvest,
    goHome
  ];

  @Profile("RemoteMiner")
  public loop() {
    try {
      data.remoteMinerCreeps.get().forEach(this.processCreep);
    } catch (error) {
      console.log('Error in RemoteMiners', error);
    }
  }

  private processCreep = (c: Creep) =>
    creepManager.processCreep(c, this.remoteMinerJobs);
}

export const remoteMinerCreepManager = new RemoteMinerCreepManager();
