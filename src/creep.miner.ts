import { TargetSelectionPolicy, CreepJob, creepManager } from './creep';
import { roomManager } from './room';
import { findStructures } from './util';
import { Profile } from './profiler';

const moveToContainer = new CreepJob('moveToContainer', 'ffaa00', 'toContainer',
  (c, t) => c.moveTo(t),
  (c, t) => c.pos.isEqualTo(t.pos),
  c => [Game.getObjectById(c.memory.container)],
  TargetSelectionPolicy.inOrder
);

const harvestForContainerBuild = new CreepJob('harvestToBuild', 'ffaa00', 'harvest',
  (c, t) => c.harvest(t),
  (c, t) => {
    const container: any = Game.getObjectById(c.memory.container)
    const nonConstruction = !(container instanceof ConstructionSite);
    const needRepair = container.hits < container.hitsMax;
    const creepFull = c.carry.energy === c.carryCapacity;
    return (nonConstruction && !needRepair) || creepFull;
  },
  c => [Game.getObjectById(c.memory.source)],
  TargetSelectionPolicy.inOrder
);

const buildContainer = new CreepJob('buildContainer', 'ffaa00', 'build',
  (c, t) => c.build(t),
  (c, t) => !(t instanceof ConstructionSite) || !c.carry.energy,
  c => [Game.getObjectById(c.memory.container)],
  TargetSelectionPolicy.inOrder
);

const repairContainer = new CreepJob('repairContainer', 'ffaa00', 'repair',
  (c, t) => c.repair(t),
  (c, t: Container) => t.hits === t.hitsMax,
  c => [Game.getObjectById(c.memory.container)],
  TargetSelectionPolicy.inOrder
);

const mine = new CreepJob('mine', '#aaaaaa', 'mine',
  (c, t) => {
    c.harvest(t);
    return c.transfer(Game.getObjectById(c.memory.container) as Container, RESOURCE_ENERGY);
  },
  (c, t: Source) => {
    const container = Game.getObjectById<Container>(c.memory.container) as Container;
    const containerNeedsRepair = container.hits < container.hitsMax;
    const containerFull = container.store.energy === container.storeCapacity;
    return containerNeedsRepair || containerFull || t.energy === 0;
  },
  c => [Game.getObjectById(c.memory.source)],
  TargetSelectionPolicy.inOrder
);

const waiting = new CreepJob('wait', '#aaaaaa', 'wait',
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

  @Profile('Miner')
  public loop() {
    const minerCreeps = Object
      .keys(Game.creeps)
      .map(n => Game.creeps[n])
      .filter(c => !c.spawning)
      .filter(c => c.memory.role === 'miner');

    minerCreeps.forEach(miner => {
      if (!miner.memory.source || !Game.getObjectById(miner.memory.container)) {
        this.chooseMiningPosition(miner, minerCreeps);
      }
      creepManager.processCreep(miner, this.minerJobs);
    });

  }

  public chooseMiningPosition(creep: Creep, minerCreeps: Creep[]) {
    const occupiedContainers = minerCreeps.map<string>(c => c.memory.container);
    const containers = findStructures<Container>(creep.room, [STRUCTURE_CONTAINER], FIND_STRUCTURES);

    const freeContainers = containers.filter(c => occupiedContainers.indexOf(c.id) < 0);
    console.log(containers.map(c => c.id));
    let container: Container | ConstructionSite;
    if (freeContainers.length) {
      container = freeContainers[0];
    } else {
      const containerConstructions = findStructures<any>(creep.room, [STRUCTURE_CONTAINER], FIND_CONSTRUCTION_SITES);
      const freeConstructions = containerConstructions.filter(c => occupiedContainers.indexOf(c.id) < 0)
      container = freeConstructions[0];
    }

    console.log(creep.name, container.id);

      const flag = roomManager.getMiningFlags(creep.room).filter(f => f.pos.isEqualTo(container.pos))[0];
      creep.memory.container = container.id;
      creep.memory.source = flag.memory.source;
  }

}

export const minerCreepManager = new MinerCreepManager;

interface MinerCreepMemory {
  job: string;
  jobTarget: string;

  flag: string;
  source: string;
  container: string;
}
