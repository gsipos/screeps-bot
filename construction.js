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
class ConstructionManager {
    loop() {
        for (let roomName in Game.rooms) {
            const room = Game.rooms[roomName];
            this.buildMiningContainers(room);
        }
    }
    buildMiningContainers(room) {
        const containers = data_1.data.of(room).containers.get();
        const containersUnderConstruction = data_1.data.of(room).containerConstructions.get();
        const currentContainers = containers.length + containersUnderConstruction.length;
        if (currentContainers === 5) {
            return;
        }
        const miningFlags = data_1.data.of(room).miningFlags.get();
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
        data_1.data.of(room).containerConstructions.clear();
    }
}
__decorate([
    profiler_1.Profile('Construction')
], ConstructionManager.prototype, "loop", null);
exports.constructionManager = new ConstructionManager;
