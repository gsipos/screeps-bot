
export class CreepJob {
  constructor(
    public name: string,
    public color: string,
    public say: string,
    public action: (creep: Creep, target: any) => number,
    public jobDone: (creep: Creep, target?: any) => boolean,
    public possibleTargets: (creep: Creep) => any[]
  ) { }

  public execute(creep: Creep, target: any) {
    const result = this.action(creep, target);
    if (result == ERR_NOT_IN_RANGE) {
      creep.moveTo(target, { visualizePathStyle: { stroke: this.color } });
    } else if (result !== OK) {
      this.finishJob(creep, target);
      return;
    }
    if (this.jobDone(creep, target)) {
      this.finishJob(creep, target);
    }
  }

  private finishJob(creep: Creep, target: any) {
    delete creep.memory.job;
    delete creep.memory.jobTarget;
  }
}

function harvestJobAction(creep: Creep, target: any) {
  const result = creep.harvest(target);
  if (result == OK) {
    creep.room
      .find<Creep>(FIND_MY_CREEPS)
      .some(c => creep.transfer(c, RESOURCE_ENERGY) == OK);
  }
  return result;
}

export class CreepManager {
  public jobs: CreepJob[] = [

    new CreepJob('harvest', '#ffaa00', '🔨 harvesting',
      (c, t) => harvestJobAction(c, t),
      c => c.carry.energy == c.carryCapacity,
      c => c.room.find(FIND_SOURCES)
    ),

    new CreepJob('fillSpawn', '#ffffff', '🏭 fillSpawn',
      (c, t) => c.transfer(t, RESOURCE_ENERGY),
      (c, t) => c.carry.energy == 0 || t.energy == t.energyCapacity,
      c => this.findStructures(c, [STRUCTURE_EXTENSION, STRUCTURE_SPAWN])
    ),

    new CreepJob('build', '#ffaa00', '🚧 build',
      (c, t) => c.build(t),
      c => c.carry.energy == 0,
      c => [c.room.controller]
    ),

    new CreepJob('upgrade', '#ffaa00', '⚡ upgrade',
      (c, t) => c.upgradeController(t),
      c => c.carry.energy == 0,
      c => [c.room.controller]
    ),

  ];
  public jobsByname: { [name: string]: CreepJob } = {};

  constructor() {
    this.jobs.forEach(j => this.jobsByname[j.name] = j);
  }

  public loop() {
    this.foreEachCreep(creep => {
      if (!creep.memory.job) {
        this.assignJob(creep);
      }
      if (creep.memory.job) {
        this.executeJob(creep);
      }
    });
  }

  private executeJob(creep: Creep) {
    this.jobsByname[creep.memory.job].execute(creep, creep.memory.jobTarget);
  }

  private assignJob(creep: Creep) {
    this.jobs.some(j =>
      j.possibleTargets(creep).some(target => {
        if (!j.jobDone(creep, target)) {
          creep.memory.job = j.name;
          creep.memory.job = target.id;
          return true;
        } else {
          return false;
        }
      })
    );
  }

  private foreEachCreep(call: (c:Creep) => any) {
    for (let name in Game.creeps) {
      call(Game.creeps[name]);
    }
  }

  private findStructures(c: Creep, structTypes: string[]) {
    return c.room
      .find<Structure>(FIND_MY_STRUCTURES)
      .filter(s => structTypes.indexOf(s.structureType) > -1);
  }

}

export const creepManager = new CreepManager();
