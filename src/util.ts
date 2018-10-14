export function findStructures<T extends Structure>(
  room: Room,
  types: string[],
  where: number = FIND_MY_STRUCTURES
) {
  return room.find<T>(where, {
    filter: (s: Structure) => types.indexOf(s.structureType) > -1
  });
}

export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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

export class Interval {
  private nextCall = Game.time;

  constructor(
    private ticks: number,
    private callBack: () => any,
    private lowCPU = false
  ) {
    this.nextCall = Game.time + ticks;
  }

  run() {
    if (!this.lowCPU && lowCPU()) return;
    if (Game.time > this.nextCall) {
      this.callBack();
      this.nextCall = Game.time + this.ticks;
    }
  }
}

export const lowCPU = () => Game.cpu.bucket < 5000;

export class RoomProvider<T> {
  private stuff: Record<string, T> = {};

  constructor(private supplier: (r: Room) => T) { }

  of(room: Room) {
    if (!this.stuff[room.name]) {
      this.stuff[room.name] = this.supplier(room);
    }
    return this.stuff[room.name];
  }
}

export const sumReducer = (a: number, b: number) => a + b;

export const averageOf = (items: number[]) => items.reduce(sumReducer, 0) / items.length;

export const boolToScore = (b: boolean) => b ? 1 : 0;

export const fails = (b: boolean) => !b;
export const succeeds = (b: boolean) => b;
