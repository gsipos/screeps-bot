import { profiler } from "../../telemetry/profiler";

type CreepTarget = Pick<RoomObject, "pos">;

export class TargetSelectionPolicy {
  public static random(targets: any[]) {
    return targets.sort(() => Math.floor(Math.random() * 3) - 1);
  }

  public static inOrder(targets: any[]) {
    return targets;
  }

  public static distance(targets: CreepTarget[], creep: Creep) {
    if (targets.length < 2) return targets;
    const distances = new WeakMap();
    targets.forEach(t =>
      distances.set(
        t,
        profiler.wrap("Distances::getRangeTo", () =>
          creep.pos.getRangeTo(t.pos)
        )
      )
    );
    return targets.sort((a, b) => distances.get(a) - distances.get(b));
  }
}

export type TargetSelectionPolicyFunction<T = any> = (targets: T[], creep: Creep) => T[];
