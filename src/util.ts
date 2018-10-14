export function findStructures<T extends Structure>(room: Room, types: string[], where: number = FIND_MY_STRUCTURES) {
  return room.find<T>(where, { filter: (s: Structure) => types.indexOf(s.structureType) > -1 });
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
