import { Profile } from './telemetry/profiler';
import { data } from './data/data';

class TowerManager {

  @Profile('Tower')
  public loop() {

    for (let name in Game.rooms) {
      const room = Game.rooms[name];
      const roomData = data.of(room);

      const towers = roomData.towers.get();
      if (!towers || !towers.length) continue;

      const hostileCreeps = data.of(room).hostileCreeps.get();
      if (hostileCreeps && hostileCreeps.length) {
        towers.forEach(t => t.attack(hostileCreeps[0]));
        return;
      }

      const decayingRampart = roomData.ramparts.get().find(this.lowerThan500HP);
      if (decayingRampart) {
        towers.forEach(t => t.repair(decayingRampart));
        return;
      }

      const damagedStructure = roomData.nonDefensiveStructures.get().find(this.notMaxHP);
      if (damagedStructure) {
        towers.forEach(t => t.repair(damagedStructure));
        return;
      }

      const damagedCreep = roomData.creeps.get().find(this.notMaxHP)
      if (!!damagedCreep) {
        towers.forEach(t => t.heal(damagedCreep));
        return;
      }
    }
  }

  private notMaxHP = (c: { hits: number; hitsMax: number }) => c.hits < c.hitsMax;
  private lowerThan500HP = (r: { hits: number }) => r.hits < 500
}

export const towerManager = new TowerManager();
