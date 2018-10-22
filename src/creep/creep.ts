import { data } from "../data/data";
import { Profile, profiler } from "../telemetry/profiler";
import { TargetSelectionPolicy } from "./job/target-selection-policy";
import { CreepJob, ICreepJob } from "./job/creep-job";

export * from "./job/creep-job";

export class CreepManager {
  public jobs: ICreepJob[] = [
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
  private currentJobs: ICreepJob[] = this.jobs;
  private currentJobsByname: Record<string, ICreepJob> = {};

  public processCreep(creep: Creep, jobs: ICreepJob[]) {
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

  private fillJobsByName = (j: ICreepJob) =>
    (this.currentJobsByname[j.name] = j);

  private executeJob = () => {
    const job = this.currentJobsByname[this.currentCreep!.memory.job];
    job.execute(this.currentCreep!, this.currentCreep!.memory.jobTarget);
  };

  private assignJob = () => this.currentJobs.some(this.findAndAssignJob);

  private findAndAssignJob = (job: ICreepJob) => job.assignJob(this.currentCreep!);
}

export const creepManager = new CreepManager();
