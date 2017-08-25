import { data } from './data';
import { stats } from './statistics';
import { Profile } from './profiler';
import { forEachRoom } from './util';

export class Efficiency {

  @Profile('Efficiency')
  public loop() {
    if (Game.cpu.bucket < 5000) return;
    forEachRoom(room => {
      this.containerUsage(room);
      this.carryCreepUtilization(room);
    });

  }

  private containerUsage(room: Room) {
    data.of(room).containers.get()
      .map(container => (container.store.energy || 0) / container.storeCapacity)
      .forEach(usage => stats.metric(`Efficiency::${room.name}::container`, usage));
  }

  private carryCreepUtilization(room: Room) {
    data.of(room).carryCreeps.get()
      .map(carry => (carry.carry.energy || 0) / carry.carryCapacity)
      .forEach(utilization => stats.metric(`Efficiency::${room.name}::carry`, utilization));
  }

}

export const efficiency = new Efficiency();
