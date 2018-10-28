import { CreepRole } from "../roles";
import { sumReducer } from "../../util";

const mapToCost = (p: string) => BODYPART_COST[p];

export class CreepType {
  public readonly cost: number;
  constructor(public name: string, public body: string[]) {
    this.cost = this.body.map(mapToCost).reduce(sumReducer, 0);
  }
}

export class MinerCreep extends CreepType {
  constructor(lvl: number) {
    const body = [];
    for (let i = 0; i <= lvl; i++) {
      body.push(WORK);
    }
    body.push(CARRY);
    body.push(MOVE);
    super(CreepRole.MINER, body);
  }
}

export class CarryCreep extends CreepType {
  constructor(lvl: number) {
    const body = [];
    for (let i = 0; i <= lvl; i++) {
      body.push(CARRY);
      body.push(MOVE);
    }
    super(CreepRole.CARRY, body);
  }
}

export class GeneralCreep extends CreepType {
  constructor(lvl: number) {
    const body = [];
    for (let i = 0; i <= lvl; i++) {
      body.push(WORK);
      body.push(CARRY);
      body.push(MOVE);
    }
    super(CreepRole.GENERAL, body);
  }
}

export class HarasserCreep extends CreepType {
  constructor(lvl: number) {
    const body = [];
    for (let i = 0; i <= lvl; i++) {
      body.push(ATTACK, MOVE);
    }
    super(CreepRole.HARASSER, body);
  }
}

export class RemoteMiner extends CreepType {
  constructor(lvl: number) {
    const body = [];
    for (let i = 0; i < lvl; i++) {
      body.push(i % 2 ? CARRY : WORK, MOVE);
      body.push(CARRY, MOVE);
    }
    super(CreepRole.REMOTEMINER, body);
  }
}
