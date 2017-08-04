import { Profile } from './profiler';
import { data } from './data';
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

  @Profile('Tower')
  public loop() {

    for (let name in Game.rooms) {
      const room = Game.rooms[name];
      data.roomTower(room).forEach(tower => {
        this.clearExpiredJob(tower);
        let towerMemory = this.getTowerMemory(tower.id);
        if (!towerMemory) {
          towerMemory = this.assignJobToTower(tower);
        }
        this.executeTowerJob(tower, towerMemory);
      });
    }
  }

  private executeTowerJob(tower: Tower, memory: TowerMemory) {
    const target = Game.getObjectById(memory.jobTarget);
    if (!target) {
      this.jobDone(tower);
    }
    memory.jobTTL--;
    let result: number = OK;
    if (memory.job === 'jobless') {
      return;
    }
    if (memory.job === 'attack') {
      result = tower.attack(target as Creep);
    }
    if (memory.job === 'repair') {
      result = tower.repair(target as Structure);
    }
    if (memory.job === 'heal') {
      result = tower.heal(target as Creep);
    }
    if (result !== OK) {
      this.jobDone(tower)
    }
  }

  private assignJobToTower(tower: Tower) {
    var towerMemory: TowerMemory;

    var closestHostile = tower.pos.findClosestByRange<Creep>(FIND_HOSTILE_CREEPS);
    if (closestHostile) {
      return this.createJob('attack', tower, closestHostile);
    }

    var closestDecayingRampart = tower.pos.findClosestByRange<Structure>(FIND_STRUCTURES, {
      filter: (s: Structure) => (s.structureType === STRUCTURE_RAMPART && s.hits < 500)
    });
    if (closestDecayingRampart) {
      return this.createJob('repair', tower, closestDecayingRampart);
    }

    var closestDamagedStructure = tower.pos.findClosestByRange<Structure>(FIND_STRUCTURES, {
      filter: (structure: Structure) => (structure.hits < structure.hitsMax)
        && (structure.structureType !== STRUCTURE_WALL)
        && (structure.structureType !== STRUCTURE_RAMPART)
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
