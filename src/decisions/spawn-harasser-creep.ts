import { RoomProvider } from "../util";
import { efficiency } from "../telemetry/efficiency";
import { data } from "../data/data";
import { Temporal } from "../data/cache/temporal";
import {
  sequence,
  condition,
  parallel
} from "./behavior-tree/behavior-tree-builder";

export const needMoreHarasserCreepTree = sequence<Room>(
  "Need More harasser creep",
  [
    condition("less than 5", () => data.harasserCreeps.get().length < 5),
    condition("spawn 75%+", r => efficiency.of(r).spawnEnergy.get() > 0.75),
    condition("spawn 75%+", r => efficiency.of(r).storageEnergy.get() > 0.1),
    parallel("and if", 2, 2, [
      condition(
        "hostiles present",
        r => data.of(r).hostileCreeps.get().length > 0
      ),
      condition(
        "spawn 75%+",
        r => efficiency.of(r).spawnEnergy.average() > 0.75
      ),
      condition(
        "towers 75%+",
        r => efficiency.of(r).towerEnergy.average() > 0.75
      )
    ])
  ]
);

export const needMoreHarasserCreep = new RoomProvider(
  room =>
    new Temporal(() => needMoreHarasserCreepTree.tick(room))
);
