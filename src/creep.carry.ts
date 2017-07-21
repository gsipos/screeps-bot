import { TargetSelectionPolicy, CreepJob, creepManager } from './creep';
import { data } from './data';

const energy = new CreepJob('energy', '#ffaa00', 'energy',
  (c, t) => c.withdraw(t, RESOURCE_ENERGY),
  (c, t) => (c.carry.energy || 0) > 0 || t.store[RESOURCE_ENERGY] === 0,
  c => data.roomContainerOrStorage(c.room).filter((s: Container | Storage) => s.store[RESOURCE_ENERGY] > 0),
  targets => targets.sort((a, b) => b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY])
);

const fillSpawnOrExtension = new CreepJob('fillSpawn', '#ffffff', 'fill:spawn',
  (c, t) => c.transfer(t, RESOURCE_ENERGY),
  (c, t) => c.carry.energy == 0 || t.energy == t.energyCapacity,
  c => data.roomExtensionOrSpawn(c.room),
  TargetSelectionPolicy.distance
);

const fillTower = new CreepJob('fillTower', '#ffffff', 'fill:tower',
  (c, t) => c.transfer(t, RESOURCE_ENERGY),
  (c, t) => c.carry.energy === 0 || t.energy === t.energyCapacity,
  c => data.roomTower(c.room),
  TargetSelectionPolicy.distance
);

const fillCreeps = new CreepJob('fillCreep', '#ee00aa', 'fill:creep',
  (c, t) => c.transfer(t, RESOURCE_ENERGY),
  (c, t: Creep) => !!t && (c.carry.energy === 0 || (t.carry.energy || 0) > 0),
  c => data.roomCreeps(c.room)
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
    data.creepByRole('carry')
      .forEach(creep => creepManager.processCreep(creep, this.carryJobs));
  }

}

export const carryCreepManager = new CarryCreepManager();
