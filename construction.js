"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const room_1 = require("./room");
const util_1 = require("./util");
class ConstructionManager {
    loop() {
        for (let roomName in Game.rooms) {
            const room = Game.rooms[roomName];
            this.buildMiningContainers(room);
        }
    }
    buildMiningContainers(room) {
        const containers = util_1.findStructures(room, [STRUCTURE_CONTAINER]);
        const containersUnderConstruction = util_1.findStructures(room, [STRUCTURE_CONTAINER], FIND_MY_CONSTRUCTION_SITES);
        const currentContainers = containers.length + containersUnderConstruction.length;
        if (currentContainers === 5) {
            return;
        }
        const miningFlags = room_1.roomManager.getMiningFlags(room);
        const maxContainers = Math.min(5, miningFlags.length);
        if (currentContainers === maxContainers) {
            return;
        }
        const buildableFlags = miningFlags
            .filter(flag => containers.every(c => !c.pos.isEqualTo(flag.pos)))
            .filter(flag => containersUnderConstruction.every(c => !c.pos.isEqualTo(flag.pos)));
        const spawn = Object.keys(Game.spawns).map(k => Game.spawns[k]).filter(s => s.room === room)[0];
        const chosen = spawn.pos.findClosestByPath(FIND_FLAGS, { filter: (f) => buildableFlags.indexOf(f) > -1 });
        chosen.pos.createConstructionSite(STRUCTURE_CONTAINER);
    }
}
exports.constructionManager = new ConstructionManager;
