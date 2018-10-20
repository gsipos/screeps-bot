import { MemoryStore, data } from "../data/data";

interface ChartedRoomInfo {
  name: string;
  enemyActivity: boolean;
  enemyTowers: boolean;
  my: boolean;
  sources: number;
  time: number;
}

type Exit = 1 | 3 | 5 | 7;

interface ChartedNeighbour {
  type: "CHARTED";
  info: ChartedRoomInfo;
  exit: Exit;
  name: string;
  pos: RoomPosition;
}

interface UnChartedNeighbour {
  type: "UNCHARTED";
  exit: Exit;
  name: string;
  pos: RoomPosition;
}

type NeighbourInfo = ChartedNeighbour | UnChartedNeighbour;

const CHARTINFO_VALIDITY = 5_000;

export class Geographer {
  private chartedRooms = new MemoryStore<ChartedRoomInfo>(
    "geographerChartedRooms"
  );

  public loop() {
    data.rooms.get().forEach(this.processRoom);
  }

  private processRoom = (room: Room) => {
    if (this.isUncharted(room.name)) {
      this.chartRoom(room);
    }
  };

  private chartRoom(room: Room) {
    const roomData = data.of(room);
    const hasHostileCreeps = !!roomData.hostileCreeps.get().length;
    const hasHostileStructures = !!roomData.hostileStructures.get().length;
    const hasHostileTowers = !!roomData.hostileTowers.get().length;
    const info: ChartedRoomInfo = {
      name: room.name,
      enemyActivity:
        hasHostileCreeps || hasHostileStructures || hasHostileTowers,
      enemyTowers: hasHostileTowers,
      my: !!room.controller && room.controller.my,
      sources: roomData.sources.get().length,
      time: Game.time
    };
    this.chartedRooms.set(room.name, info);
  }

  private isUncharted(room: string) {
    const info = this.chartedRooms.get(room);
    if (!info) {
      return false;
    }
    if (Game.time - info.time > CHARTINFO_VALIDITY) {
      this.chartedRooms.delete(room);
      return false;
    }
    return true;
  }

  public describeNeighbours(room: Room) {
    const exits = Game.map.describeExits(room.name);
    const infos: NeighbourInfo[] = [];

    const top = exits[TOP];
    if (top) {
      infos.push(this.toNeighborInfo(top, TOP));
    }

    const right = exits[RIGHT];
    if (right) {
      infos.push(this.toNeighborInfo(right, RIGHT));
    }

    const bottom = exits[BOTTOM];
    if (bottom) {
      infos.push(this.toNeighborInfo(bottom, BOTTOM));
    }

    const left = exits[LEFT];
    if (left) {
      infos.push(this.toNeighborInfo(left, LEFT));
    }

    return infos;
  }

  private toNeighborInfo(name: string, exit: Exit): NeighbourInfo {
    if (this.isUncharted(name)) {
      return {
        type: "UNCHARTED",
        exit,
        name,
        pos: new RoomPosition(25, 25, name)
      };
    } else {
      const info = this.chartedRooms.get(name);
      return {
        type: "CHARTED",
        exit,
        name,
        info,
        pos: new RoomPosition(25, 25, name)
      };
    }
  }
}

export const geographer = new Geographer();
