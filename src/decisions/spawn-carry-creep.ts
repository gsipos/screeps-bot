import { RoomProvider, fails, succeeds } from "../util";
import { efficiency } from "../telemetry/efficiency";
import { data } from "../data/data";
import { Temporal } from "../data/cache/temporal";

export const needMoreCarryCreep = new RoomProvider(
  room =>
    new Temporal(() => {
      const telemetry = efficiency.roomEfficiencyProvider.of(room);
      const carryCreepCount = data.of(room).carryCreeps.get().length;

      const hardRequirements = [carryCreepCount > 1];

      const hardLimits = [
        carryCreepCount < 7,
        telemetry.carryUtilization.average() > 0.2,
        telemetry.spawnEnergy.get() > 0.75
      ];

      const softRequirements = [
        telemetry.carryUtilization.average() < 0.7,
        telemetry.containerUsage.average() < 0.4,
        telemetry.containerUsage.average() < 0.9,
        telemetry.spawnEnergy.average() > 0.75,
        telemetry.towerEnergy.average() > 0.75
      ];
      return (
        hardRequirements.some(fails) ||
        (hardLimits.every(succeeds) &&
          softRequirements.filter(fails).length > 1)
      );
    })
);
