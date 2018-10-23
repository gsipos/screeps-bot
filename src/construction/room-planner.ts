import { data } from "../data/data";
import { Profile } from "../telemetry/profiler";

const up = (p: RoomPosition, d: number = 1) =>
  new RoomPosition(p.x, p.y - d, p.roomName);
const down = (p: RoomPosition, d = 1) =>
  new RoomPosition(p.x, p.y + d, p.roomName);
const left = (p: RoomPosition, d = 1) =>
  new RoomPosition(p.x - d, p.y, p.roomName);
const right = (p: RoomPosition, d = 1) =>
  new RoomPosition(p.x + d, p.y, p.roomName);

class RoomPlanner {

  @Profile("RoomPlanner")
  loop() {
    try {
      data.rooms.get().forEach(room => this.build(room));
    } catch (error) {
      console.log("Roomplanner", error);
    }
  }

  build(room: Room) {
    if (!room.controller || !room.controller.my) {
      return;
    }
    const lvl = room.controller.level;
    const spawn = data.of(room).spawns.get()[0];
    if (!spawn) {
      return;
    }
    this.buildStorage(room, lvl);
    this.buildTower(room, lvl);
  }

  buildStorage(room: Room, lvl: number) {
    if (!this.max(STRUCTURE_STORAGE, lvl) || room.storage) {
      return;
    }
    const hasStrorageConstruction = data
      .of(room)
      .constructions.get()
      .filter(site => site.structureType === STRUCTURE_STORAGE).length;
    if (hasStrorageConstruction) {
      return;
    }

    const spawn = data.of(room).spawns.get()[0];
    this.buildAroundPos(STRUCTURE_STORAGE, spawn.pos, room);
  }

  buildTower(room: Room, lvl: number) {
    const towerCount =
      data.of(room).towers.get().length +
      data
        .of(room)
        .constructions.get()
        .filter(site => site.structureType === STRUCTURE_TOWER).length;
    if (towerCount >= this.max(STRUCTURE_TOWER, lvl)) {
      return;
    }

    const spawn = data.of(room).spawns.get()[0];
    this.buildAroundPos(STRUCTURE_TOWER, spawn.pos, room);
  }

  buildAroundPos(type: string, pos: RoomPosition, room: Room) {
    [
      up(pos, 2),
      left(pos, 2),
      down(pos, 2),
      right(pos, 2),
      up(left(pos, 2), 2),
      down(left(pos, 2), 2),
      down(right(pos, 2), 2),
      up(right(pos, 2), 2)
    ].some(candidate => {
      const free =
        this.positionFreeForBuild(candidate) &&
        this.noAdjacentStructures(candidate, room);
      if (free) {
        candidate.createConstructionSite(type);
      }
      return free;
    });
  }

  positionFreeForBuild = (pos: RoomPosition) =>
    pos
      .look()
      .every(
        look =>
          look.type !== LOOK_STRUCTURES &&
          (look.type === "terrain" && look.terrain !== "wall")
      );

  noAdjacentStructures = (p: RoomPosition, room: Room) => {
    const result = room.lookForAtArea(
      LOOK_STRUCTURES,
      p.y - 1,
      p.x - 1,
      p.y + 1,
      p.x + 1,
      true
    ) as LookAtResultWithPos[];
    return !result.length;
  };

  max = (name: string, lvl: number) => CONTROLLER_STRUCTURES[name][lvl];
}

export const roomPlanner = new RoomPlanner();
