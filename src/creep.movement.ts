import { data } from './data';
import { stats } from './statistics';
import { getRandomInt } from './util';
import { profiler, Profile } from "./profiler";
import { messaging } from './messaging';

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

    this.initTo(toKey);
    let moveResult: number = OK;
    if (this.isStuck(creep)) {
      creep.move(this.getRandomDirection());
      this.setPrevPos(creep);
      stats.metric('Creep::Move::Stuck', 1);
      return OK;
    }

    let path: string;
    if (false && this.hasPath(fromKey, toKey)) { //TODO: some bug
      path = this.getPath(fromKey, toKey);
      stats.metric('Creep::Move::Reusepath', 1);
    } else {
      path = profiler.wrap('Creep::Move::findPath', () => creep.room.findPath(creep.pos, target, { ignoreCreeps: true, serialize: true }) as any);
      messaging.send('path',fromKey+'|'+toKey+'|'+path);
      this.storePath(fromKey, toKey, path);
      stats.metric('Creep::Move::FindPath', 1);
    }

    moveResult = profiler.wrap('Creep::Move::moveByPath', () => creep.moveByPath(path));

    stats.metric('Creep::Move::' + moveResult, 1);

    if (moveResult !== OK) {
      console.log('Creep\tMove\t' + moveResult);
      if (moveResult === ERR_NOT_FOUND) {
        creep.move(this.getRandomDirection());
      }
    }
    this.setPrevPos(creep);

    return moveResult;
  }

  public isStuck(creep: Creep) {
    if (!creep.memory.posSince) return false;
    if (Game.time - creep.memory.posSince > 3) {
      return true;
    }
    return false;
  }
  public setPrevPos(creep: Creep) {
    const creepPos: string = '' + creep.pos;
    if (creep.memory.prevPos !== creepPos) {
      creep.memory.prevPos = creepPos;
      creep.memory.posSince = Game.time;
    }
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

  @Profile('Creep::Move')
  public loop() {
    messaging.consumeMessages('path').forEach(m => {
      console.log('consume message', m);
      const splitMessage = m.value.split('|');
      this.storePath(splitMessage[0], splitMessage[1], splitMessage[2]);
    })
  }
}

export const creepMovement = new CreepMovement();
