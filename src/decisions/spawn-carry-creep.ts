import { RoomProvider, fails, succeeds } from "../util";
import { efficiency } from "../telemetry/efficiency";
import { data } from "../data/data";
import { Temporal } from "../data/cache/temporal";
import {
  selector,
  sequence,
  condition,
  parallel
} from "./behavior-tree/behavior-tree-builder";
import { treeSuccess } from "./behavior-tree/behavior-tree-status";

const telemetry = (r: Room) => efficiency.of(r);

export const needMoreCarryCreepTree = selector<Room>("spawn carry", [
  sequence("definitely when", [
    condition("carries < 2", s => data.of(s).carryCreeps.get().length < 2)
  ]),
  sequence("or", [
    sequence("when possible", [
      condition("less than max", r => data.of(r).carryCreeps.get().length < 7),
      condition(
        "carry 20%+",
        r => telemetry(r).carryUtilization.average() > 0.2
      ),
      condition("spawn energy 75%+", r => telemetry(r).spawnEnergy.get() > 0.75)
    ]),
    parallel("and needed", 4, 2, [
      condition(
        "carry 70%+",
        r => telemetry(r).carryUtilization.average() > 0.75
      ),
      condition(
        "containers 40%+",
        r => telemetry(r).containerUsage.average() > 0.4
      ),
      condition(
        "containers 90%+",
        r => telemetry(r).containerUsage.average() > 0.9
      ),
      condition("spawn 75%-", r => telemetry(r).spawnEnergy.average() < 0.75),
      condition("tower 75%-", r => telemetry(r).towerEnergy.average() < 0.75)
    ])
  ])
]);

export const needMoreCarryCreep = new RoomProvider(
  room => new Temporal(() => treeSuccess(needMoreCarryCreepTree.tick(room)))
);
