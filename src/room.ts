import { data } from './data';

class RoomManager {

  public initRooms() {
    if (!Memory.flags) {
      Memory.flags = {};
    }
    for (let name in Game.rooms) {
      const room = Game.rooms[name];

      if (!room.memory.miningFlags) {
        const sources = room.find<Source>(FIND_SOURCES).forEach(source => {
          const miningSpots = this.getAdjacentNonWallPositions(room, source.pos);
          miningSpots.forEach(spot => {
            const flagName = 'mine|' + spot.x + ':' + spot.y;
            room.createFlag(spot.x, spot.y, flagName, COLOR_BROWN, COLOR_BROWN);
            Memory.flags[flagName] = { role: 'mine', source: source.id };
          });
        });
        room.memory.miningFlags = true;
      }
    }
  }

  private getAdjacentNonWallPositions(room: Room, pos: RoomPosition) {
    const terrain = room.lookForAtArea(LOOK_TERRAIN, pos.y - 1, pos.x - 1, pos.y + 1, pos.x + 1, true) as LookAtResultWithPos[];
    return terrain.filter(t => t.terrain !== 'wall');
  }

  public getMiningFlags(room: Room): Flag[] {
    return data.roomMiningFlags(room);
  }
}

export const roomManager = new RoomManager();
