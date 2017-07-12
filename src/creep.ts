import { findStructures } from './util';

export class TargetSelectionPolicy {
  public static random(targets: any[]) {
    return targets.sort(() => Math.floor((Math.random() * 3)) - 1);
  }

  public static inOrder(targets: any[]) {
    return targets;
  }

  public static distance(targets: RoomObject[], creep: Creep) {
    const distances = new WeakMap();
    targets.forEach(t => distances.set(t, creep.pos.getRangeTo(t)));
    return targets.sort((a, b) => distances.get(a) - distances.get(b));
  }

  public static proportionalToDistance(targets: RoomObject[], creep: Creep) {
    let distance = targets.map(t => creep.pos.getRangeTo(t));

    const sumDistance = distance.reduce((a, b) => a + b, 0);
    const weights = distance.map(d => sumDistance / d);
    const sumWeight = weights.reduce((a, b) => a + b, 0);
    const weightByTarget = new WeakMap();
    targets.forEach((t, idx) => weightByTarget.set(t, weights[idx]));
    const targetsByWeightDesc = targets.sort((a, b) => weightByTarget.get(b) - weightByTarget.get(a));

    let probability = Math.random() * sumWeight;
    console.log('Prob:', probability, 'sumwhe', sumWeight, targetsByWeightDesc.map(t => weightByTarget.get(t)));
    while (probability > 0.0) {
      probability -= weightByTarget.get(targetsByWeightDesc[0]);
      if (probability > 0.0) {
        targetsByWeightDesc.shift();
      }
    }
    console.log('Wheights', targetsByWeightDesc.map(t => weightByTarget.get(t)));
    return targetsByWeightDesc;
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
    public targetSelectionPolicy: (targets: any[], creep: Creep) => any[]
  ) { }

  public execute(creep: Creep, targetId: any) {
    const target: any = Game.getObjectById(targetId);
    if (this.jobDone(creep, target)) {
      this.finishJob(creep, target);
      return;
    }
    const result = this.action(creep, target);
    console.log(this.name, creep.name, result);
    if (result == ERR_NOT_IN_RANGE) {
      const moveResult = creep.moveTo(target, { visualizePathStyle: { stroke: this.color } });
      if (moveResult == ERR_NO_PATH) {
        this.finishJob(creep, target);
      }
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
      c => this.getSourcesForRoom(c.room),
      TargetSelectionPolicy.proportionalToDistance
    ),

    new CreepJob('fillTower', '#ffffff', 'fillTower',
      (c, t) => c.transfer(t, RESOURCE_ENERGY),
      (c, t) => c.carry.energy == 0 || t.energy == t.energyCapacity,
      c => this.findStructures(c, [STRUCTURE_TOWER]),
      TargetSelectionPolicy.distance
    ),

    new CreepJob('fillSpawn', '#ffffff', '🏭 fillSpawn',
      (c, t) => c.transfer(t, RESOURCE_ENERGY),
      (c, t) => c.carry.energy == 0 || t.energy == t.energyCapacity,
      c => this.findStructures(c, [STRUCTURE_EXTENSION, STRUCTURE_SPAWN]),
      TargetSelectionPolicy.inOrder
    ),

    new CreepJob('build', '#ffaa00', '🚧 build',
      (c, t) => c.build(t),
      c => c.carry.energy == 0,
      c => c.room.find(FIND_MY_CONSTRUCTION_SITES),
      TargetSelectionPolicy.distance
    ),

    new CreepJob('smallWall', '#ffaa00', 'wall',
      (c, t) => c.repair(t),
      (c, t) => c.carry.energy == 0 || t.hits >= 500,
      c => this.findStructures(c, [STRUCTURE_WALL], FIND_STRUCTURES).filter(w => w.hits < 500),
      TargetSelectionPolicy.distance
    ),

    new CreepJob('upgrade', '#ffaa00', '⚡ upgrade',
      (c, t) => c.upgradeController(t),
      c => c.carry.energy == 0,
      c => [c.room.controller],
      TargetSelectionPolicy.inOrder
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
    const job = this.jobsByname[creep.memory.job];
    console.log('execute job', creep.name, job.name);
    this.jobsByname[creep.memory.job].execute(creep, creep.memory.jobTarget);
  }

  private assignJob(creep: Creep) {
    this.jobs.some(j =>
      j.targetSelectionPolicy(j.possibleTargets(creep), creep).some(target => {
        console.log(creep.name, j.name, target.id, j.jobDone(creep, target));
        if (!j.jobDone(creep, target)) {

          creep.memory.job = j.name;
          creep.memory.jobTarget = target.id;
          creep.say(j.say);
          return true;
        } else {
          return false;
        }
      })
    );
  }

  private foreEachCreep(call: (c: Creep) => any) {
    for (let name in Game.creeps) {
      call(Game.creeps[name]);
    }
  }

  public getCreepsByRole(role: string) {
    return Object.keys(Game.creeps)
      .map(c => Game.creeps[c])
      .filter(c => c.memory.role === role);
  }

  private findStructures(c: Creep, structTypes: string[], type: number = FIND_MY_STRUCTURES) {
    return findStructures(c.room, structTypes, type); // TODO
  }

  private sourcesByRoom = new Map<Room, Source[]>();
  private getSourcesForRoom(room: Room): Source[] {
    if (!this.sourcesByRoom.has(room)) {
      this.sourcesByRoom.set(room, room.find<Source>(FIND_SOURCES));
    }
    return this.sourcesByRoom.get(room) as Source[];
  }

}

export const creepManager = new CreepManager();

class MinerCreepManager {

  public loop() {

  }

}
