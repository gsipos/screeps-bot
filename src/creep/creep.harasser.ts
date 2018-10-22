import { data } from "../data/data";
import { creepManager, CreepJob, TargetSelectionPolicy } from "./creep";
import { Profile } from "../telemetry/profiler";

const attack = (targets: (c: Creep) => any[]) =>
  new CreepJob(
    "attack",
    "#ffffff",
    "Attack",
    (c, t) => c.attack(t),
    (c, t) => !!t,
    targets,
    TargetSelectionPolicy.distance
  );

const attackLocalEnemyCreeps = attack(c => data.of(c.room).hostileCreeps.get());

const attackLocalEnemyTowers = attack(c => data.of(c.room).hostileTowers.get());

const attackLocalEnemyStructures = attack(c =>
  data.of(c.room).hostileStructures.get()
);

export const moveTo = (targets: (c: Creep) => any[]) =>
  new CreepJob(
    "explore",
    "#ffffff",
    "Explore",
    (c, t) => ERR_NOT_IN_RANGE,
    (c, t) => c.room.name === t.name || !!data.of(c.room).hostileCreeps.get().length,
    targets,
    TargetSelectionPolicy.random
  );

const exploreUnchartedTerritories = moveTo(c =>
  data
    .of(c.room)
    .neighbourRooms.get()
    .filter(n => n.type === "UNCHARTED")
);

const goToUndefendedKnownEnemy = moveTo(c =>
  data
    .of(c.room)
    .neighbourRooms.get()
    .filter(
      n => n.type === "CHARTED" && n.info.enemyActivity && !n.info.enemyTowers
    )
);

const goToDefendedKnownEnemy = moveTo(c =>
  data
    .of(c.room)
    .neighbourRooms.get()
    .filter(
      n => n.type === "CHARTED" && n.info.enemyActivity && n.info.enemyTowers
    )
);

const wanderAround = moveTo(c => data.of(c.room).neighbourRooms.get());

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
      console.log('Error with harassercreep', error);
    }
  }

  private processCreep = (c: Creep) =>
    creepManager.processCreep(c, this.harasserJobs);
}

export const harasserCreepManager = new HarasserCreepManager();
