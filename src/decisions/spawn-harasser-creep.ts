import { RoomProvider, succeeds } from "../util";
import { TTL } from "../data/cache/ttl";
import { efficiency } from "../telemetry/efficiency";
import { data } from "../data/data";

export const needMoreHarasserCreep = new RoomProvider(
  room => new TTL(50, () => {
    const telemetry = efficiency.roomEfficiencyProvider.of(room);

    const hardLimits = [
      data.harasserCreeps.get().length < 5,
      telemetry.spawnEnergy.get() > 0.75,
      telemetry.storageEnergy.get() > 0.3
    ];

    const softRequirements = [
      data.of(room).hostileCreeps.get().length > 0,
      telemetry.towerEnergy.average() > 0.75,
      telemetry.spawnEnergy.average() > 0.75
    ];

    return hardLimits.every(succeeds) && softRequirements.filter(succeeds).length > 1;
  })
);
