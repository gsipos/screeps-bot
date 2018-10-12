import { data } from "./data/data";
import { Profile } from "./telemetry/profiler";

class RoomManager {
  @Profile("Room")
  public initRooms() {
    if (!Memory.flags) {
      Memory.flags = {};
    }
    for (let name in Game.rooms) {
      const room = Game.rooms[name];

      if (!room.memory.miningFlags) {
        const processMiningSpotForRoom = this.processMiningSpot(room);
        data
          .of(room)
          .sources.get()
          .forEach(source => {
            const miningSpots = this.getAdjacentNonWallPositions(
              room,
              source.pos
            );
            const processMiningSpotOfSource = processMiningSpotForRoom(source);
            miningSpots.forEach(processMiningSpotOfSource);
          });
        room.memory.miningFlags = true;
      }
    }
  }

  private processMiningSpot = (room: Room) => (source: Source) => (
    spot: LookAtResultWithPos
  ) => {
    const flagName = "mine|" + spot.x + ":" + spot.y;
    room.createFlag(spot.x, spot.y, flagName, COLOR_BROWN, COLOR_BROWN);
    data.of(room).miningFlags.clear();
    Memory.flags[flagName] = { role: "mine", source: source.id };
  };

  private getAdjacentNonWallPositions(room: Room, pos: RoomPosition) {
    const terrain = room.lookForAtArea(
      LOOK_TERRAIN,
      pos.y - 1,
      pos.x - 1,
      pos.y + 1,
      pos.x + 1,
      true
    ) as LookAtResultWithPos[];
    return terrain.filter(this.notWallTerrain);
  }

  private notWallTerrain = (t: LookAtResultWithPos) => t.terrain !== "wall";

  public getMiningFlags(room: Room): Flag[] {
    return data.of(room).miningFlags.get();
  }
}

export const roomManager = new RoomManager();
