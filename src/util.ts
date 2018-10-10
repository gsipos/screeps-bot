import { Profile, profiler } from "./profiler";

export function findStructures<T extends Structure>(room: Room, types: string[], where: number = FIND_MY_STRUCTURES) {
  return room.find<T>(where, { filter: (s: Structure) => types.indexOf(s.structureType) > -1 });
}

export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export class Lazy<T> {
  private value: T | undefined;

  constructor(private supplier: () => T) { }

  public get(): T {
    if (!this.value) {
      this.value = this.supplier();
    }
    return this.value;
  }

  public clear() {
    this.value = undefined;
  }
}

export class Temporal < T > {
  private value: T | undefined;
  private captureTime: number | undefined;

  constructor(private supplier: () => T) { }

  @Profile('Temporal')
  public get(): T {
    if (!this.value || this.captureTime !== Game.time) {
      this.value = profiler.wrap('Temporal::supplier', this.supplier);
      this.captureTime = Game.time;
    }
    return this.value;
  }

  public clear() {
    this.value = undefined;
  }
}

export class TTL<T> {
  public static hit = 0;
  public static miss = 0;

  private value: T | undefined;
  private maxAge: number = Game.time - 1;

  constructor(private ttl: number, private supplier: () => T) { }

  public get(): T {
    if (this.emptyValue || this.old || this.arrayValueHasNullOrUndefinedItem) {
      try {
        this.value = this.supplier();
      } catch (e) {
        console.log('Caught in TTL', e);
      }
      this.maxAge = Game.time + this.ttl;
      TTL.miss++;
    } else {
      TTL.hit++;
    }
    return this.value as T;
  }

  private get emptyValue() {
    return this.value === null || this.value === undefined;
  }

  private get arrayValueHasNullOrUndefinedItem(): boolean {
    if (this.value instanceof Array) {
      return this.value.some(item => item === null || item === undefined);
    } else {
      return false;
    }
  }

  private get old() {
    return Game.time > this.maxAge;
  }

  public clear() {
    this.value = undefined;
  }
}

export function forEachRoom(call: (room: Room) => any) {
  for (let roomName in Game.rooms) {
    try {
      call(Game.rooms[roomName]);
    } catch (e) {
      console.log(e);
    }
  }
}
