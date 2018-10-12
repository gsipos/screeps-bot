import { TargetSelectionPolicy, CreepJob, creepManager } from "./creep";
import { roomManager } from "../room";
import { findStructures } from "../util";
import { Profile } from "../telemetry/profiler";
import { data } from "../data/data";

const moveToContainer = new CreepJob(
  "moveToContainer",
  "ffaa00",
  "toContainer",
  (c, t) => ERR_NOT_IN_RANGE,
  (c, t) => !!t && c.pos.isEqualTo(t.pos),
  c => {
    const container = Game.getObjectById(c.memory.container);
    return !!container ? [container] : [];
  },
  TargetSelectionPolicy.inOrder
);

const harvestForContainerBuild = new CreepJob(
  "harvestToBuild",
  "ffaa00",
  "harvest",
  (c, t) => c.harvest(t),
  (c, t) => {
    const container: any = Game.getObjectById(c.memory.container);
    const nonConstruction = !(container instanceof ConstructionSite);
    const needRepair = container.hits < container.hitsMax;
    const creepFull = c.carry.energy === c.carryCapacity;
    return (nonConstruction && !needRepair) || creepFull;
  },
  c => [Game.getObjectById(c.memory.source)],
  TargetSelectionPolicy.inOrder
);

const buildContainer = new CreepJob(
  "buildContainer",
  "ffaa00",
  "build",
  (c, t) => c.build(t),
  (c, t) => !(t instanceof ConstructionSite) || !c.carry.energy,
  c => [Game.getObjectById(c.memory.container)],
  TargetSelectionPolicy.inOrder
);

const repairContainer = new CreepJob(
  "repairContainer",
  "ffaa00",
  "repair",
  (c, t) => c.repair(t),
  (c, t: Container) => t.hits === t.hitsMax,
  c => [Game.getObjectById(c.memory.container)],
  TargetSelectionPolicy.inOrder
);

const mine = new CreepJob(
  "mine",
  "#aaaaaa",
  "mine",
  (c, t) => {
    c.harvest(t);
    return c.transfer(
      Game.getObjectById(c.memory.container) as Container,
      RESOURCE_ENERGY
    );
  },
  (c, t: Source) => {
    const container = Game.getObjectById<Container>(
      c.memory.container
    ) as Container;
    const containerNeedsRepair = container.hits < container.hitsMax;
    const containerFull = container.store.energy === container.storeCapacity;
    return containerNeedsRepair || containerFull || t.energy === 0;
  },
  c => [Game.getObjectById(c.memory.source)],
  TargetSelectionPolicy.inOrder
);

const waiting = new CreepJob(
  "wait",
  "#aaaaaa",
  "wait",
  c => 0,
  (c, t: Source) => t.energy > 0,
  c => [Game.getObjectById(c.memory.source)],
  TargetSelectionPolicy.inOrder
);

class MinerCreepManager {
  public minerJobs = [
    moveToContainer,
    harvestForContainerBuild,
    buildContainer,
    repairContainer,
    mine,
    waiting
  ];

  @Profile("Miner")
  public loop() {
    const minerCreeps = data.minerCreeps.get().filter(this.notSpawning);

    minerCreeps.forEach(miner => {
      if (!miner.memory.source || !Game.getObjectById(miner.memory.container)) {
        this.chooseMiningPosition(miner, minerCreeps);
      }
      creepManager.processCreep(miner, this.minerJobs);
    });
  }

  private occupiedContainers: string[] = [];
  private currentContainer: Container | ConstructionSite | undefined;
  public chooseMiningPosition(creep: Creep, minerCreeps: Creep[]) {
    const roomData = data.of(creep.room);
    this.occupiedContainers = minerCreeps.map<string>(this.mapToContainer);
    const containers = roomData.containers.get();
    const freeContainers = containers.filter(this.isNotOccupied);

    if (freeContainers.length) {
      this.currentContainer = freeContainers[0];
    } else {
      const containerConstructions = roomData.containerConstructions.get();
      const freeConstructions = containerConstructions.filter(
        this.isNotOccupied
      );
      this.currentContainer = freeConstructions[0];
    }
    if (this.currentContainer) {
      console.log(creep.name, this.currentContainer.id);
      const flag = roomData.miningFlags
        .get()
        .filter(this.matchesActContainerPos)[0];
      creep.memory.container = this.currentContainer.id;
      creep.memory.source = flag.memory.source;
    } else {
      console.log("WARN: no container found for mining position");
    }
  }

  private notSpawning = (c: { spawning: boolean }) => !c.spawning;
  private mapToContainer = (c: Creep) => c.memory.container;
  private isNotOccupied = (c: { id: string }) => !this.occupiedContainers.includes(c.id);
  private matchesActContainerPos = (f: {pos: RoomPosition}) => f.pos.isEqualTo(this.currentContainer!.pos);
}

export const minerCreepManager = new MinerCreepManager();

interface MinerCreepMemory {
  job: string;
  jobTarget: string;

  flag: string;
  source: string;
  container: string;
}
