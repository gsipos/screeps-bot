"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RoomManager {
    constructor() {
        this.miningFlagsByRoom = new Map();
    }
    initRooms() {
        for (let name in Game.rooms) {
            const room = Game.rooms[name];
            if (!room.memory.miningFlags) {
                const sources = room.find(FIND_SOURCES).forEach(source => {
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
    getAdjacentNonWallPositions(room, pos) {
        const terrain = room.lookForAtArea(LOOK_TERRAIN, pos.y - 1, pos.x - 1, pos.y + 1, pos.x + 1, true);
        return terrain.filter(t => t.terrain !== 'wall');
    }
    getMiningFlags(room) {
        return room.find(FIND_FLAGS, { filter: (flag) => flag.memory.role === 'mine' });
        /*if (!this.miningFlagsByRoom.has(room)) {
          this.miningFlagsByRoom.set(room, room.find<Flag>(FIND_FLAGS, { filter: (flag: Flag) => flag.memory.role === 'mine' }));
        }
        return this.miningFlagsByRoom.get(room) as Flag[];
    */
    }
}
exports.roomManager = new RoomManager();
