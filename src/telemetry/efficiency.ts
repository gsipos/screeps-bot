import { data } from "../data/data";
import { stats } from "./statistics";
import { Profile, profiler } from "./profiler";
import { forEachRoom } from "../util";

export class Efficiency {
  @Profile("Efficiency")
  public loop() {
    if (Game.cpu.bucket < 5000) return;
    forEachRoom(room => {
      this.currentRoom = room;
      this.containerUsage(room);
      this.carryCreepUtilization(room);
      this.sourceMining(room);
      this.energyAvailable(room);
    });
    profiler.wrap("Efficiency::EmptyFunction", this.effTestNoop);
  }

  private effTestNoop = () => 1;

  private containerToUsage = (container: StructureContainer) =>
    (container.store.energy || 0) / container.storeCapacity;

  private carryUsage = (carry: Creep) =>
    (carry.carry.energy || 0) / carry.carryCapacity;

  private sourceFullness = (s: Source) => s.energy / s.energyCapacity;

  private currentRoom: Room | undefined;

  private report = (v: number, stat: string) =>
    stats.metric(`Efficiency::${this.currentRoom!.name}::${stat}`, v);

  private reportContainerUsage = (v: number) => this.report(v, "container");
  private reportCarryUtilization = (v: number) => this.report(v, "carry");
  private reportSourceMining = (v: number) => this.report(v, "source");

  private containerUsage(room: Room) {
    data
      .of(room)
      .containers.get()
      .map(this.containerToUsage)
      .forEach(this.reportContainerUsage);
  }

  private carryCreepUtilization(room: Room) {
    data
      .of(room)
      .carryCreeps.get()
      .map(this.carryUsage)
      .forEach(this.reportCarryUtilization);
  }

  private sourceMining(room: Room) {
    data
      .of(room)
      .sources.get()
      .map(this.sourceFullness)
      .forEach(this.reportSourceMining);
  }

  private energyAvailable(room: Room) {
    this.report(room.energyAvailable / room.energyCapacityAvailable, "energy");
  }
}

export const efficiency = new Efficiency();
