"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_1 = require("./data");
class ConstructionManager {
    loop() {
        for (let roomName in Game.rooms) {
            const room = Game.rooms[roomName];
            this.buildMiningContainers(room);
        }
    }
    buildMiningContainers(room) {
        const containers = data_1.data.roomContainers(room);
        const containersUnderConstruction = data_1.data.roomContainerConstruction(room);
        const currentContainers = containers.length + containersUnderConstruction.length;
        if (currentContainers === 5) {
            return;
        }
        const miningFlags = data_1.data.roomMiningFlags(room);
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
        data_1.data.roomContainerContructionChanged(room);
    }
}
exports.constructionManager = new ConstructionManager;
