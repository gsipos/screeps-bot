export function findStructures<T extends Structure>(room: Room, types: string[], where: number = FIND_MY_STRUCTURES) {
  return room.find<T>(where, { filter: (s: Structure) => types.indexOf(s.structureType) > -1 });
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
  private captureTime: number;

  constructor(private supplier: () => T) { }

  public get(): T {
    if (!this.value || this.captureTime !== Game.time) {
      this.value = this.supplier();
      this.captureTime = Game.time;
    }
    return this.value;
  }
}

export class TTL<T> {
  private value: T | undefined;
  private maxAge: number;

  constructor(private ttl: number, private supplier: () => T) { }

  public get(): T {
    if (!this.value || this.old) {
      this.value = this.supplier();
      this.maxAge = Game.time + this.ttl;
    }
    return this.value;
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
    call(Game.rooms[roomName]);
  }
}
