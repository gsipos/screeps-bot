import { data, pathStore } from "../data/data";
import { Profile, profiler } from "../telemetry/profiler";
import { stats } from "../telemetry/statistics";
import { creepMovement } from "./creep.movement";

export class TargetSelectionPolicy {
  public static random(targets: any[]) {
    return targets.sort(() => Math.floor(Math.random() * 3) - 1);
  }

  public static inOrder(targets: any[]) {
    return targets;
  }

  public static distance(targets: RoomObject[], creep: Creep) {
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

export class CreepJob {
  constructor(
    public name: string,
    public color: string,
    public say: string,
    public action: (creep: Creep, target: any) => number,
    public jobDone: (creep: Creep, target?: any) => boolean,
    public possibleTargets: (creep: Creep) => any[],
    public targetSelectionPolicy: (targets: any[], creep: Creep) => any[],
    public enoughCreepAssigned: (
      assignedCreeps: Creep[],
      target: any
    ) => boolean = () => false
  ) {}

  public execute(creep: Creep, targetId: any) {
    const target: any = Game.getObjectById(targetId);
    if (!target) {
      this.finishJob(creep, target);
      return;
    }
    if (this.jobDone(creep, target)) {
      this.finishJob(creep, target);
      return;
    }
    const result = profiler.wrap("Creep::action::" + this.name, () =>
      this.action(creep, target)
    );
    if (result == ERR_NOT_IN_RANGE) {
      this.moveCreep(creep, target);
    } else if (result !== OK) {
      this.finishJob(creep, target);
      return;
    }
    if (this.jobDone(creep, target)) {
      this.finishJob(creep, target);
    }
  }

  private moveCreep(creep: Creep, target: RoomObject) {
    if (!target) return;
    let moveResult = profiler.wrap("Creep::Move", () =>
      creepMovement.moveCreep(creep, target.pos)
    );
    if (moveResult === ERR_NO_PATH) {
      this.finishJob(creep, target);
    }
    return moveResult;
  }

  private finishJob(creep: Creep, target: any) {
    delete creep.memory.job;
    delete creep.memory.jobTarget;
    delete creep.memory.path;
  }

  public needMoreCreeps(target: any) {
    const assignedCreeps = data.creepsByJobTarget(this.name, target.id);
    return !this.enoughCreepAssigned(assignedCreeps, target);
  }
}

type JobsByName = { [name: string]: CreepJob };

export class CreepManager {
  public jobs: CreepJob[] = [
    new CreepJob(
      "idle",
      "#ffaa00",
      "idle",
      c => 0,
      c => (c.carry.energy || 0) > 0,
      c => [c],
      TargetSelectionPolicy.inOrder
    ),

    new CreepJob(
      "build",
      "#ffaa00",
      "🚧 build",
      (c, t) => c.build(t),
      c => c.carry.energy == 0,
      c => c.room.find(FIND_MY_CONSTRUCTION_SITES),
      TargetSelectionPolicy.distance
    ),

    new CreepJob(
      "smallWall",
      "#ffaa00",
      "wall",
      (c, t) => c.repair(t),
      (c, t) => c.carry.energy == 0 || t.hits >= 500,
      c =>
        data
          .of(c.room)
          .walls.get()
          .filter(w => w.hits < 500),
      TargetSelectionPolicy.distance
    ),

    new CreepJob(
      "upgrade",
      "#ffaa00",
      "⚡ upgrade",
      (c, t) => c.upgradeController(t),
      c => c.carry.energy == 0,
      c => [c.room.controller],
      TargetSelectionPolicy.inOrder
    )
  ];

  @Profile("Creep")
  public loop() {
    data.generalCreeps
      .get()
      .forEach(creep => this.processCreep(creep, this.jobs));
  }

  private currentCreep: Creep | undefined;
  private currentJobs: CreepJob[] = this.jobs;
  private currentJobsByname: Record<string, CreepJob> = {};

  public processCreep(creep: Creep, jobs: CreepJob[]) {
    this.currentCreep = creep;
    this.currentJobs = jobs;

    this.currentJobsByname = {};
    jobs.forEach(this.fillJobsByName); // TODO

    if (!creep.memory.job) {
      profiler.wrap("Creep::assignJob::" + creep.memory.role, this.assignJob);
    }
    if (creep.memory.job) {
      profiler.wrap("Creep::executeJob::" + creep.memory.role, this.executeJob);
    }
  }

  private fillJobsByName = (j: CreepJob) =>
    (this.currentJobsByname[j.name] = j);

  private executeJob = () => {
    const job = this.currentJobsByname[this.currentCreep!.memory.job];
    job.execute(this.currentCreep!, this.currentCreep!.memory.jobTarget);
  };

  private currentJob: CreepJob | undefined;
  private assignJob = () => this.currentJobs.some(this.findAndAssignJob);

  private defined = (t: any) => !!t;

  private findAndAssignJob = (j: CreepJob) => {
    this.currentJob = j;
    return j
      .targetSelectionPolicy(
        j
          .possibleTargets(this.currentCreep!)
          .filter(this.defined)
          .filter(this.jobDoneOnTarget)
          .filter(this.targetNeedsMoreCreep),
        this.currentCreep!
      )
      .some(this.setUnfinishedJobTargetToCreep);
  };

  private jobDoneOnTarget = (t: any) =>
    !this.currentJob!.jobDone(this.currentCreep!, t);
  private targetNeedsMoreCreep = (t: any) => this.currentJob!.needMoreCreeps(t);

  private setUnfinishedJobTargetToCreep = (target: any) => {
    if (!this.currentJob!.jobDone(this.currentCreep!, target)) {
      this.currentCreep!.memory.job = this.currentJob!.name;
      this.currentCreep!.memory.jobTarget = target.id;
      this.currentCreep!.say(this.currentJob!.say);
      data.registerCreepJob(this.currentCreep!);
      return true;
    } else {
      return false;
    }
  };
}

export const creepManager = new CreepManager();
