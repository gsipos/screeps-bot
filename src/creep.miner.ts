import { TargetSelectionPolicy, CreepJob, creepManager } from './creep';
import { roomManager } from './room';
import { findStructures } from './util';

const moveToContainer = new CreepJob('moveToContainer', 'ffaa00', 'toContainer',
  (c, t) => c.moveTo(t),
  (c, t) => c.pos.isEqualTo(t.pos),
  c => [Game.getObjectById(c.memory.container)],
  TargetSelectionPolicy.inOrder
);

const harvestForContainerBuild = new CreepJob('harvestToBuild', 'ffaa00', 'harvest',
  (c, t) => c.harvest(t),
  (c, t: ConstructionSite) => !(t instanceof ConstructionSite),
  c => [Game.getObjectById(c.memory.container)],
  TargetSelectionPolicy.inOrder
);

const buildContainer = new CreepJob('buildContainer', 'ffaa00', 'build',
  (c, t) => c.build(t),
  (c, t) => !(t instanceof ConstructionSite) || !c.carry.energy,
  c => [Game.getObjectById(c.memory.container)],
  TargetSelectionPolicy.inOrder
);

const mine = new CreepJob('mine', '#aaaaaa', 'mine',
  (c, t) => {
    c.harvest(Game.getObjectById(t) as Source);
    return c.transfer(Game.getObjectById(c.memory.container) as Container, RESOURCE_ENERGY);
  },
  c => false,
  c => [Game.getObjectById(c.memory.source)],
  TargetSelectionPolicy.inOrder
);

class MinerCreepManager {

  public minerJobs = [
    moveToContainer,
    harvestForContainerBuild,
    buildContainer,
    mine
  ];

  public loop() {
    const minerCreeps = Object
      .keys(Game.creeps)
      .map(n => Game.creeps[n])
      .filter(c => c.memory.role === 'miner');

    minerCreeps.forEach(miner => {
      if (!miner.memory.source) {
        this.chooseMiningPosition(miner, minerCreeps);
      }
      creepManager.processCreep(miner, this.minerJobs);
    });

  }

  public chooseMiningPosition(creep: Creep, minerCreeps: Creep[]) {
    const occupiedContainers = minerCreeps.map<string>(c => creep.memory.container);
    const containers = findStructures<Container>(creep.room, [STRUCTURE_CONTAINER]);

    const freeContainers = containers.filter(c => occupiedContainers.indexOf(c.id) > -1);
    let container: Container | ConstructionSite;
    if (freeContainers.length) {
      container = freeContainers[0];
    } else {
      container = findStructures<any>(creep.memory, [STRUCTURE_CONTAINER], FIND_CONSTRUCTION_SITES)
        .filter(c => occupiedContainers.indexOf(c.id) > -1)[0];
    }

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
