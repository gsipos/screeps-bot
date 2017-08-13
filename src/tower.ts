import { Profile } from './profiler';
import { data } from './data';

class TowerManager {

  @Profile('Tower')
  public loop() {

    for (let name in Game.rooms) {
      const room = Game.rooms[name];
      const roomData = data.of(room);

      const towers = roomData.towers.get();
      const closestHostile = towers[0].pos.findClosestByRange<Creep>(FIND_HOSTILE_CREEPS);
      if (closestHostile) {
        towers.forEach(t => t.attack(closestHostile));
        return;
      }

      const decayingRampart = roomData.ramparts.get().find(r => r.hits < 500);
      if (decayingRampart) {
        towers.forEach(t => t.repair(decayingRampart));
        return;
      }

      const damagedStructure = roomData.nonDefensiveStructures.get().find(s => s.hits > s.hitsMax);
      if (damagedStructure) {
        towers.forEach(t => t.repair(damagedStructure));
        return;
      }

      const damagedCreep = roomData.creeps.get().find(c => c.hits < c.hitsMax)
      if (!!damagedCreep) {
        towers.forEach(t => t.heal(damagedCreep));
        return;
      }
    }
  }
}

export const towerManager = new TowerManager();
