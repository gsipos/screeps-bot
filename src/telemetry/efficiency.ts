import { data } from "../data/data";
import { stats } from "./statistics";
import { Profile, profiler } from "./profiler";
import {
  forEachRoom,
  RoomProvider,
  sumReducer,
  averageOf,
  myRoom
} from "../util";
import { RollingAverageComputed } from "../data/cache/rolling-avg-computed";
import { CreepRole } from "../creep/roles";

export class RoomEfficiency {
  constructor(private room: Room) {}

  private containerToUsage = (container: StructureContainer) =>
    (container.store.energy || 0) / container.storeCapacity;

  private carryUsage = (carry: Creep) =>
    (carry.carry.energy || 0) / carry.carryCapacity;

  private toEnergyCapacityRatio = (
    s: Pick<Source, "energy" | "energyCapacity">
  ) => s.energy / s.energyCapacity;

  containerUsage = new RollingAverageComputed(
    () =>
      averageOf(
        data
          .of(this.room)
          .containers.get()
          .map(this.containerToUsage)
      ),
    100
  );

  carryUtilization = new RollingAverageComputed(
    () =>
      averageOf(
        data
          .of(this.room)
          .carryCreeps.get()
          .map(this.carryUsage)
      ),
    100
  );

  sourceMining = new RollingAverageComputed(
    () =>
      averageOf(
        data
          .of(this.room)
          .sources.get()
          .map(this.toEnergyCapacityRatio)
      ),
    100
  );

  towerEnergy = new RollingAverageComputed(
    () =>
      averageOf(
        data
          .of(this.room)
          .towers.get()
          .map(this.toEnergyCapacityRatio)
      ),
    100
  );

  spawnEnergy = new RollingAverageComputed(
    () =>
      averageOf(
        data
          .of(this.room)
          .extensionOrSpawns.get()
          .map(this.toEnergyCapacityRatio)
      ),
    100
  );

  storageEnergy = new RollingAverageComputed(
    () =>
      !!this.room.storage
        ? (this.room.storage.store.energy || 0) /
          this.room.storage.storeCapacity
        : 0,
    100
  );
}

export class Efficiency {
  public roomEfficiencyProvider = new RoomProvider(r => new RoomEfficiency(r));

  @Profile("Efficiency")
  public loop() {
    if (Game.cpu.bucket < 5000) return;
    data.rooms
      .get()
      .filter(room => myRoom(room))
      .forEach(room => {
        const efficiency = this.roomEfficiencyProvider.of(room);
        this.report(efficiency.containerUsage.get(), "container", room);
        this.report(efficiency.carryUtilization.get(), CreepRole.CARRY, room);
        this.report(efficiency.sourceMining.get(), "source", room);
        this.report(efficiency.spawnEnergy.get(), "spawn", room);

        this.energyAvailable(room);
      });
    profiler.wrap("Efficiency::EmptyFunction", this.effTestNoop);
  }

  private effTestNoop = () => 1;

  private report = (v: number, stat: string, room: Room) =>
    stats.metric(`Efficiency::${room.name}::${stat}`, v);

  private energyAvailable(room: Room) {
    this.report(
      room.energyAvailable / room.energyCapacityAvailable,
      "energy",
      room
    );
  }
}

export const efficiency = new Efficiency();
