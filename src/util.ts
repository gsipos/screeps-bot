export function findStructures<T extends Structure>(room: Room, types: string[], where: number = FIND_MY_STRUCTURES) {
  return room.find<T>(where, { filter: (s: Structure) => types.indexOf(s.structureType) > -1 });
}
