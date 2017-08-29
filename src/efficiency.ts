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
      this.sourceMining(room);
      this.energyAvailable(room);
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

  private sourceMining(room: Room) {
    data.of(room).sources.get()
      .map(s => s.energy / s.energyCapacity)
      .forEach(unMined => stats.metric(`Efficiency::${room.name}::source`, unMined));
  }

  private energyAvailable(room: Room) {
    stats.metric(`Efficiency::${room.name}::energy`, room.energyAvailable / room.energyCapacityAvailable);
  }

}

export const efficiency = new Efficiency();
