import { TargetSelectionPolicy, CreepJob, creepManager } from './creep';
import { data } from './data';
import { Profile } from './profiler';

const sumCreepEnergy = (creeps: Creep[]) => creeps.map(c => c.carry.energy || 0).reduce((a, b) => a + b, 0);

const energy = new CreepJob('energy', '#ffaa00', 'energy',
  (c, t) => c.withdraw(t, RESOURCE_ENERGY),
  (c, t) => (c.carry.energy || 0) > 0 || t.store[RESOURCE_ENERGY] === 0,
  c => data.roomContainerOrStorage(c.room).filter((s: Container | Storage) => s.store[RESOURCE_ENERGY] > c.carryCapacity),
  TargetSelectionPolicy.distance
);

const fillSpawnOrExtension = new CreepJob('fillSpawn', '#ffffff', 'fill:spawn',
  (c, t) => c.transfer(t, RESOURCE_ENERGY),
  (c, t) => c.carry.energy == 0 || t.energy == t.energyCapacity,
  c => data.roomExtensionOrSpawn(c.room),
  TargetSelectionPolicy.distance,
  (ac, t) => t.energyCapacity - t.energy < sumCreepEnergy(ac)
);

const fillTower = new CreepJob('fillTower', '#ffffff', 'fill:tower',
  (c, t) => c.transfer(t, RESOURCE_ENERGY),
  (c, t) => c.carry.energy === 0 || t.energy === t.energyCapacity,
  c => data.roomTower(c.room),
  TargetSelectionPolicy.distance,
  (ac, t: Tower) => (t.energyCapacity - t.energy) < sumCreepEnergy(ac)
);

const fillCreeps = new CreepJob('fillCreep', '#ee00aa', 'fill:creep',
  (c, t) => c.transfer(t, RESOURCE_ENERGY),
  (c, t: Creep) => !!t && (c.carry.energy === 0 || (t.carry.energy || 0) > 0),
  c => data.roomCreeps(c.room)
    .filter(creep => creep.memory.role !== 'miner')
    .filter(creep => creep.memory.role !== 'carry'),
  TargetSelectionPolicy.distance,
  (ac, t: Creep) => t.carryCapacity - (t.carry.energy || 0) < sumCreepEnergy(ac)
);

const fillStorage = new CreepJob('fillStorage', 'af1277', 'fill:storage',
  (c, t) => c.transfer(t, RESOURCE_ENERGY, (c.carry.energy || 0) - c.carryCapacity*0.5),
  (c, t: Storage) => !!t && ((c.carry.energy || 0) <= c.carryCapacity*0.5 || t.storeCapacity === t.store.energy),
  c => c.room.storage ? [c.room.storage] : [],
  TargetSelectionPolicy.inOrder
);

const idleFill = new CreepJob('idlefill', '#ffaa00', 'idle',
  (c, t) => c.withdraw(t, RESOURCE_ENERGY),
  (c, t) => (c.carry.energy || 0) > (c.carryCapacity*0.5) || t.store[RESOURCE_ENERGY] === 0,
  c => data.roomContainers(c.room).filter(s => s.store[RESOURCE_ENERGY] > 0),
  targets => targets.sort((a, b) => b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY])
);

class CarryCreepManager {

  public carryJobs = [
    energy,
    fillTower,
    fillSpawnOrExtension,
    fillCreeps,
    fillStorage,
    idleFill
  ];

  @Profile('Carry')
  public loop() {
    data.creepByRole('carry')
      .forEach(creep => creepManager.processCreep(creep, this.carryJobs));
  }

}

export const carryCreepManager = new CarryCreepManager();
