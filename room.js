"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_1 = require("./data");
class RoomManager {
    initRooms() {
        if (!Memory.flags) {
            Memory.flags = {};
        }
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
        return data_1.data.roomMiningFlags(room);
    }
}
exports.roomManager = new RoomManager();
