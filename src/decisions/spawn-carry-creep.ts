import { TTL } from "../data/cache/ttl";
import { RoomProvider, fails, succeeds } from "../util";
import { efficiency } from "../telemetry/efficiency";
import { data } from "../data/data";

export const needMoreCarryCreep = new RoomProvider(
  room =>
    new TTL(50, () => {
      const telemetry = efficiency.roomEfficiencyProvider.of(room);
      const carryCreepCount = data.of(room).carryCreeps.get().length;

      const hardRequirements = [carryCreepCount > 1];

      const hardLimits = [
        carryCreepCount < 7,
        telemetry.carryUtilization.average() > 0.2
      ];

      const softRequirements = [
        telemetry.carryUtilization.average() < 0.5,
        telemetry.containerUsage.average() < 0.3,
        telemetry.spawnEnergy.average() > 0.75,
        telemetry.towerEnergy.average() > 0.75
      ];
      console.log('Spawn carry:', hardRequirements, hardLimits, softRequirements);
      return (
        hardRequirements.some(fails) ||
        (hardLimits.every(succeeds) &&
          softRequirements.filter(fails).length > 1)
      );
    })
);
