import { Profile } from './profiler';
import { data } from './data';
type TowerJobType = 'attack' | 'repair' | 'heal' | 'jobless';

interface TowerMemory {
  job: TowerJobType;
  jobTarget: string;

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
      data.of(room).towers.get().forEach(tower => {
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
    let result: number = OK;
    if (memory.job === 'jobless') {
      result = OK - 1;
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

    var decayingRampart = data.of(tower.room).ramparts.get().find(r => r.hits < 500);
    if (decayingRampart) {
      return this.createJob('repair', tower, decayingRampart);
    }

    var damagedStructure = data.of(tower.room).nonDefensiveStructures.get().find(s => s.hits > s.hitsMax);
    if (damagedStructure) {
      return this.createJob('repair', tower, damagedStructure);
    }

    var damagedCreep = data.of(tower.room).creeps.get().find(c => c.hits < c.hitsMax)
    if (damagedCreep) {
      return this.createJob('heal', tower, damagedCreep);
    }

    return this.createJob('jobless', tower, { id: 'nojob' });
  }

  private createJob(job: TowerJobType, tower: Tower, target: { id: string }) {
    const towerMemory: TowerMemory = { job: job, jobTarget: target.id };
    Memory.towers[tower.id] = towerMemory;
    return towerMemory;
  }

  private jobDone(tower: Tower) {
    delete Memory.towers[tower.id];
  }

  private getTowerMemory(towerId: string): TowerMemory {
    return Memory.towers[towerId];
  }
}

export const towerManager = new TowerManager();
