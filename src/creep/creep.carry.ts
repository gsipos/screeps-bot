import { CreepJob, creepManager } from './creep';
import { data } from '../data/data';
import { Profile } from '../telemetry/profiler';
import { TargetSelectionPolicy } from './job/target-selection-policy';
import { sumReducer } from '../util';

const sumCreepEnergy = (creeps: Creep[]) => creeps.map(c => c.carry.energy || 0).reduce(sumReducer, 0);

const energy = new CreepJob('energy', '#ffaa00', 'energy',
  (c, t) => c.withdraw(t, RESOURCE_ENERGY),
  (c, t) => (c.carry.energy || 0) > 0 || t.store[RESOURCE_ENERGY] === 0,
  c => data.of(c.room).containerOrStorage.get()
    .filter(s => (s.store[RESOURCE_ENERGY] || 0) > c.carryCapacity),
  TargetSelectionPolicy.distance
);

const fillSpawnOrExtension = new CreepJob('fillSpawn', '#ffffff', 'fill:spawn',
  (c, t) => c.transfer(t, RESOURCE_ENERGY),
  (c, t) => c.carry.energy == 0 || t.energy == t.energyCapacity,
  c => data.of(c.room).extensionOrSpawns.get(),
  TargetSelectionPolicy.distance,
  (ac, t) => t.energyCapacity - t.energy < sumCreepEnergy(ac)
);

const fillTower = new CreepJob('fillTower', '#ffffff', 'fill:tower',
  (c, t) => c.transfer(t, RESOURCE_ENERGY),
  (c, t) => c.carry.energy === 0 || t.energy === t.energyCapacity,
  c => data.of(c.room).towers.get(),
  TargetSelectionPolicy.distance,
  (ac, t: Tower) => (t.energyCapacity - t.energy) < sumCreepEnergy(ac)
);

const fillCreeps = new CreepJob('fillCreep', '#ee00aa', 'fill:creep',
  (c, t) => c.transfer(t, RESOURCE_ENERGY),
  (c, t: Creep) => !!t && (c.carry.energy === 0 || (t.carry.energy || 0) === t.carryCapacity),
  c => data.of(c.room).fillableCreeps.get(),
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
  c => data.of(c.room).containers.get().filter(s => s.store[RESOURCE_ENERGY] > 0),
  (targets) => targets.sort((a, b) => b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY])
);

class CarryCreepManager {

  public carryJobs = [
    energy,
    fillSpawnOrExtension,
    fillTower,
    fillCreeps,
    fillStorage,
    idleFill
  ];

  @Profile('Carry')
  public loop() {
    data.carryCreeps.get()
      .forEach(this.processCreep);
  }

  private processCreep = (c: Creep) => creepManager.processCreep(c, this.carryJobs);

}

export const carryCreepManager = new CarryCreepManager();
