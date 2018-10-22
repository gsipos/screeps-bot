import { data } from "../data/data";
import { creepManager, CreepJob } from "./creep";
import { Profile } from "../telemetry/profiler";
import { TargetSelectionPolicy } from "./job/target-selection-policy";
import { MoveToRoomCreepJob } from "./job/creep-job";
import { toName } from "../util";

const attack = (name: string, targets: (c: Creep) => any[]) =>
  new CreepJob(
    name,
    "#ffffff",
    "Attack",
    (c, t) => c.attack(t),
    (c, t) => !t,
    targets,
    TargetSelectionPolicy.distance
  );

const hostileCreepsInRoom = (c: Creep) =>
  !!data.of(c.room).hostileCreeps.get().length;

const attackLocalEnemyCreeps = attack("attackLocalEnemyCreeps", c =>
  data.of(c.room).hostileCreeps.get()
);

const attackLocalEnemyTowers = attack("attackLocalEnemyTowers", c =>
  data.of(c.room).hostileTowers.get()
);

const attackLocalEnemyStructures = attack("attackLocalEnemyStructures", c =>
  data.of(c.room).hostileStructures.get()
);

const exploreUnchartedTerritories = new MoveToRoomCreepJob(
  "exploreUnchartedTerritories",
  "#ffffff",
  "Explore",
  hostileCreepsInRoom,
  c =>
    data
      .of(c.room)
      .neighbourRooms.get()
      .filter(n => n.type === "UNCHARTED")
      .map(toName),
  TargetSelectionPolicy.random
);

const goToUndefendedKnownEnemy = new MoveToRoomCreepJob(
  "goToUndefendedKnownEnemy",
  "#ffffff",
  "-> Attack",
  hostileCreepsInRoom,
  c =>
    data
      .of(c.room)
      .neighbourRooms.get()
      .filter(
        n => n.type === "CHARTED" && n.info.enemyActivity && !n.info.enemyTowers
      )
      .map(toName),
  TargetSelectionPolicy.random
);

const goToDefendedKnownEnemy = new MoveToRoomCreepJob(
  "goToDefendedKnownEnemy",
  "#ffffff",
  "-> Attack",
  hostileCreepsInRoom,
  c =>
    data
      .of(c.room)
      .neighbourRooms.get()
      .filter(
        n => n.type === "CHARTED" && n.info.enemyActivity && n.info.enemyTowers
      )
      .map(toName),
  TargetSelectionPolicy.inOrder
);

const wanderAround = new MoveToRoomCreepJob(
  "wanderAround",
  "#ffffff",
  "wandering",
  hostileCreepsInRoom,
  c =>
    data
      .of(c.room)
      .neighbourRooms.get()
      .map(toName),
  TargetSelectionPolicy.random
);

class HarasserCreepManager {
  public harasserJobs = [
    attackLocalEnemyCreeps,
    attackLocalEnemyTowers,
    attackLocalEnemyStructures,
    exploreUnchartedTerritories,
    goToUndefendedKnownEnemy,
    goToDefendedKnownEnemy,
    wanderAround
  ];

  @Profile("Harasser")
  public loop() {
    try {
      data.harasserCreeps.get().forEach(this.processCreep);
    } catch (error) {
      console.log("Error with harassercreep", error);
    }
  }

  private processCreep = (c: Creep) =>
    creepManager.processCreep(c, this.harasserJobs);
}

export const harasserCreepManager = new HarasserCreepManager();
