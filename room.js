"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const data_1 = require("./data");
const profiler_1 = require("./profiler");
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
__decorate([
    profiler_1.Profile('Room')
], RoomManager.prototype, "initRooms", null);
exports.roomManager = new RoomManager();
