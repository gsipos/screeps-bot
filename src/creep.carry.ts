import { TargetSelectionPolicy, CreepJob, creepManager } from './creep';
import { findStructures } from './util';

const energy = new CreepJob('energy', '#ffaa00', 'energy',
  (c, t) => c.withdraw(t, RESOURCE_ENERGY),
  (c, t) => (c.carry.energy || 0) > 0 || t.store[RESOURCE_ENERGY] === 0,
  c => findStructures(c.room, [STRUCTURE_CONTAINER, STRUCTURE_STORAGE], FIND_STRUCTURES).filter((s: Container | Storage) => s.store[RESOURCE_ENERGY] > 0),
  targets => targets.sort((a, b) => b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY])
);

const fillSpawnOrExtension = new CreepJob('fillSpawn', '#ffffff', 'fill:spawn',
  (c, t) => c.transfer(t, RESOURCE_ENERGY),
  (c, t) => c.carry.energy == 0 || t.energy == t.energyCapacity,
  c => findStructures(c.room, [STRUCTURE_EXTENSION, STRUCTURE_SPAWN]),
  TargetSelectionPolicy.distance
);

const fillTower = new CreepJob('fillTower', '#ffffff', 'fill:tower',
  (c, t) => c.transfer(t, RESOURCE_ENERGY),
  (c, t) => c.carry.energy == 0 || t.energy == t.energyCapacity,
  c => findStructures(c.room, [STRUCTURE_TOWER]),
  TargetSelectionPolicy.distance
);

const fillCreeps = new CreepJob('fillCreep', '#ee00aa', 'fill:creep',
  (c, t) => c.transfer(t, RESOURCE_ENERGY),
  (c, t: Creep) => t.carry.energy === t.carryCapacity || !!c.carry.energy,
  c => c.room.find<Creep>(FIND_MY_CREEPS)
    .filter(creep => creep.memory.role !== 'miner')
    .filter(creep => creep.memory.role !== 'carry'),
  TargetSelectionPolicy.distance
);

class CarryCreepManager {

  public carryJobs = [
    energy,
    fillTower,
    fillSpawnOrExtension,
    fillCreeps
  ];

  public loop() {
    for (let name in Game.creeps) {
      const creep = Game.creeps[name];
      if (creep.memory.role === 'carry') {
        creepManager.processCreep(creep, this.carryJobs);
      }
    }
  }

}

export const carryCreepManager = new CarryCreepManager();
