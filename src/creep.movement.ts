import { data } from './data';
import { stats } from './statistics';
import { getRandomInt } from './util';
export class CreepMovement {
  private pathsToTarget: {
    [to: string]: {
      [from: string]: string
    }
  } = {};

  public moveCreep(creep: Creep, target: RoomPosition) {
    if (creep.fatigue > 0) return OK;
    const fromKey = '' + creep.pos;
    const toKey = '' + target;

    creep.memory.prevPos = '' + creep.pos;

    this.initTo(toKey);

    let path: string;
    if (this.hasPath(fromKey, toKey)) {
      path = this.getPath(fromKey, toKey);
    } else {
      path = creep.room.findPath(creep.pos, target, { ignoreCreeps: true, serialize: true }) as any;
      this.storePath(fromKey, toKey, path);
    }

    let moveResult = creep.moveByPath(path);

    stats.metric('Creep::Move::' + moveResult, 1);

    if (moveResult !== OK) {
      console.log('Creep\tMove\t' + moveResult);
      stats.metric('Creep::Move::PATH_NOT_FOUND', 1);
      if (moveResult === ERR_NOT_FOUND) {
        creep.move(this.getRandomDirection());
      }
    }
    return moveResult;
  }

  public initTo(toKey: string) {
    if (!this.pathsToTarget[toKey]) {
      this.pathsToTarget[toKey] = {};
    }
  }

  private getRandomDirection(): number {
    return getRandomInt(1, 8);
  }

  private getPath(fromKey: string, toKey: string): string {
    return this.pathsToTarget[toKey][fromKey];
  }

  private hasPath(fromKey: string, toKey: string): boolean {
    return !!this.getPath(fromKey, toKey);
  }

  private storePath(fromKey: string, toKey: string, path: string) {
    this.pathsToTarget[toKey][fromKey] = path;
  }
}

export const creepMovement = new CreepMovement();
