type TowerJobType = 'attack' | 'repair' | 'heal' | 'jobless';

interface TowerMemory {
  job: TowerJobType;
  jobTarget: string;
  jobTTL: number;
}

class TowerManager {
  private jobTTL = 5;


  constructor() {
    if (!Memory.towers) {
      Memory.towers = {};
    }
  }

  public loop() {
    const towers = this.getTowers();
    towers.forEach(tower => {
      this.clearExpiredJob(tower);
      let towerMemory = this.getTowerMemory(tower.id);
      if (!towerMemory) {
        towerMemory = this.assignJobToTower(tower);
      }
      this.executeTowerJob(tower, towerMemory);
    });
  }

  private executeTowerJob(tower: Tower, memory: TowerMemory) {
    const target = Game.getObjectById(memory.jobTarget);
    if (!target) {
      this.jobDone(tower);
    }
    memory.jobTTL--;

    if (memory.job === 'jobless') {
      return;
    }
    if (memory.job === 'attack') {
      tower.attack(target as Creep);
    }
    if (memory.job === 'repair') {
      tower.repair(target as Structure);
    }
    if (memory.job === 'heal') {
      tower.heal(target as Creep);
    }

  }

  private assignJobToTower(tower: Tower) {
    var towerMemory: TowerMemory;

    var closestHostile = tower.pos.findClosestByRange<Creep>(FIND_HOSTILE_CREEPS);
    if (closestHostile) {
      return this.createJob('attack', tower, closestHostile);
    }

    var closestDamagedStructure = tower.pos.findClosestByRange<Structure>(FIND_STRUCTURES, {
      filter: (structure: Structure) => (structure.hits < structure.hitsMax) && (structure.structureType !== STRUCTURE_WALL)
    });
    if (closestDamagedStructure) {
      return this.createJob('repair', tower, closestDamagedStructure);
    }

    var closestDamagedCreep = tower.pos.findClosestByRange<Creep>(FIND_MY_CREEPS, {
      filter: (creep: Creep) => creep.hits < creep.hitsMax
    });
    if (closestDamagedCreep) {
      return this.createJob('heal', tower, closestDamagedCreep);
    }

    return this.createJob('jobless', tower, { id: 'nojob' });
  }

  private createJob(job: TowerJobType, tower: Tower, target: { id: string }) {
    const towerMemory: TowerMemory = { job: job, jobTarget: target.id, jobTTL: this.jobTTL };
    Memory.towers[tower.id] = towerMemory;
    return towerMemory;
  }

  public getTowers(): Tower[] {
    return Object.keys(Game.structures)
      .map(id => Game.structures[id] as Tower)
      .filter(s => s.structureType === STRUCTURE_TOWER)
  }

  private clearExpiredJob(tower: Tower) {
    let mem = this.getTowerMemory(tower.id);
    if (mem && mem.jobTTL <= 0) {
      this.jobDone(tower);
    }
  }

  private jobDone(tower: Tower) {
    delete Memory.towers[tower.id];
  }

  private getTowerMemory(towerId: string): TowerMemory {
    return Memory.towers[towerId];
  }
}

export const towerManager = new TowerManager();
