import { profiler } from "../../telemetry/profiler";
import { creepMovement } from "../creep.movement";
import { data } from "../../data/data";
import { TargetSelectionPolicyFunction } from "./target-selection-policy";
import { notNullOrUndefined, fails, succeeds } from "../../util";
import { NeighbourInfo } from "../../room/geographer";

type CreepAction<T = any> = (creep: Creep, target: T) => number;
type CreepJobDone<T = any> = (creep: Creep, target: T) => boolean;
type CreepJobPossibleTargets<T = any> = (creep: Creep) => T[];
type CreepJobEnoughAssigned<T = any> = (
  assignedCreeps: Creep[],
  target: T
) => boolean;

export interface ICreepJob {
  name: string;
  color: string;
  execute: (creep: Creep, target: any) => void;
  assignJob: (creep: Creep) => boolean;
}

class BaseCreepJob {
  protected finishJob(creep: Creep, target: any) {
    delete creep.memory.job;
    delete creep.memory.jobTarget;
    delete creep.memory.path;
  }

  protected moveCreep(creep: Creep, target: RoomPosition) {
    if (!target) return;
    let moveResult = profiler.wrap("Creep::Move", () =>
      creepMovement.moveCreep(creep, target)
    );
    if (moveResult === ERR_NO_PATH) {
      this.finishJob(creep, target);
    }
    return moveResult;
  }
}

export class CreepJob extends BaseCreepJob implements ICreepJob {
  constructor(
    public name: string,
    public color: string,
    private say: string,
    private action: CreepAction,
    private jobDone: CreepJobDone,
    private possibleTargets: CreepJobPossibleTargets,
    private targetSelectionPolicy: TargetSelectionPolicyFunction,
    private enoughCreepAssigned: CreepJobEnoughAssigned = () => false
  ) {
    super();
  }

  public execute(creep: Creep, targetId: any) {
    const target: any = Game.getObjectById(targetId);
    if (!target) {
      console.log(`Cannot find job ${this.name} target ${targetId}`);
      this.finishJob(creep, target);
      return;
    }
    if (this.jobDone(creep, target)) {
      console.log(
        `Job ${this.name} done by ${creep.name} on ${creep.memory.job}`
      );
      this.finishJob(creep, target);
      return;
    }
    const result = profiler.wrap("Creep::action::" + this.name, () =>
      this.action(creep, target)
    );
    if (result == ERR_NOT_IN_RANGE) {
      console.log(`Target for job ${this.name} is not in range`);
      this.moveCreep(creep, target.pos);
    } else if (result !== OK) {
      console.log(
        `Finishing job ${this.name} because unhandled error ${result}`
      );
      this.finishJob(creep, target);
      return;
    }
    if (this.jobDone(creep, target)) {
      this.finishJob(creep, target);
    }
  }

  private needMoreCreeps = (target: any) => {
    const assignedCreeps = data.creepsByJobTarget(this.name, target.id);
    return !this.enoughCreepAssigned(assignedCreeps, target);
  };

  private findJobsFor(creep: Creep) {
    const jobs = this.possibleTargets(creep)
      .filter(notNullOrUndefined)
      .filter(t => !this.jobDone(creep, t))
      .filter(this.needMoreCreeps);
    return this.targetSelectionPolicy(jobs, creep);
  }

  public assignJob(creep: Creep) {
    const jobs = this.findJobsFor(creep);
    if (jobs.length) {
      const target = jobs[0];
      creep.memory.job = this.name;
      creep.memory.jobTarget = target.id;
      creep.say(this.say);
      console.log(
        `Asssign job ${this.name} to ${creep.memory.role} ${creep.name} `
      );
      data.registerCreepJob(creep);
      return true;
    } else {
      return false;
    }
  }
}

export class MoveToRoomCreepJob extends BaseCreepJob implements ICreepJob {
  private targetToPos = (target: string) => new RoomPosition(25, 25, target);

  constructor(
    public name: string,
    public color: string,
    private say: string,
    private jobDone: CreepJobDone<string>,
    private possibleTargets: CreepJobPossibleTargets<string>,
    private targetSelectionPolicy: TargetSelectionPolicyFunction<string>
  ) {
    super();
  }

  public execute(creep: Creep, room: string) {
    if (this.isInRoom(creep, room)) {
      this.finishJob(creep, room);
      return;
    }
    if (!this.onBorder(creep) && this.jobDone(creep, room)) {
      this.finishJob(creep, room);
      return;
    }
    if (this.moveCreep(creep, this.targetToPos(room)) !== OK) {
      this.finishJob(creep, room);
      return;
    }
  }

  private isInRoom(creep: Creep, room: string) {
    return creep.room.name === room && !this.onBorder(creep);
  }

  private onBorder(creep: Creep) {
    const onBorder = [
      creep.pos.x === 0,
      creep.pos.x === 49,
      creep.pos.y === 0,
      creep.pos.y === 49
    ];
    return onBorder.some(succeeds);
  }

  public assignJob(creep: Creep) {
    const rooms = this.targetSelectionPolicy(
      this.possibleTargets(creep),
      creep
    ).filter(room => (creep.room.name === room));
    if (rooms.length) {
      const room = rooms[0];
      creep.memory.job = this.name;
      creep.memory.jobTarget = room;
      creep.say(this.say);
      data.registerCreepJob(creep);
      return true;
    } else {
      return false;
    }
  }
}
