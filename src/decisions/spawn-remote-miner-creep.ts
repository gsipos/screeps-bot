import { RoomProvider, succeeds } from "../util";
import { efficiency } from "../telemetry/efficiency";
import { data } from "../data/data";
import { Temporal } from "../data/cache/temporal";

export const needMoreRemoteMinerCreep = new RoomProvider(
  room => new Temporal(() => {
    const telemetry = efficiency.roomEfficiencyProvider.of(room);

    const hardLimits = [
      telemetry.spawnEnergy.get() > 0.75,
      telemetry.spawnEnergy.average() > 0.75,
      !!room.controller && room.controller.level > 3,
      data.of(room).remoteMinerCreeps.get().length < 3
    ];

    return hardLimits.every(succeeds);
  }
  ));
