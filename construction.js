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
        const roomData = data_1.data.of(room);
        const containers = roomData.containers.get();
        const containersUnderConstruction = roomData.containerConstructions.get();
        const currentContainers = containers.length + containersUnderConstruction.length;
        if (currentContainers === 5) {
            return;
        }
        const miningFlags = roomData.miningFlags.get();
        const maxContainers = Math.min(5, miningFlags.length, roomData.sources.get().length);
        if (currentContainers === maxContainers) {
            return;
        }
        const coveredSources = miningFlags
            .filter(flag => flag.memory.chosen)
            .map(flag => flag.memory.source);
        const buildableFlags = miningFlags.filter(flag => !coveredSources.includes(flag.memory.source));
        const spawn = roomData.spawns.get()[0];
        const chosen = spawn.pos.findClosestByPath(FIND_FLAGS, { filter: (f) => buildableFlags.includes(f) });
        if (chosen) {
            chosen.memory.chosen = true;
            chosen.pos.createConstructionSite(STRUCTURE_CONTAINER);
            roomData.containerConstructions.clear();
        }
        else {
            console.log('WARN: no chosen buildable flag', coveredSources, buildableFlags, chosen);
        }
    }
}
__decorate([
    profiler_1.Profile('Construction')
], ConstructionManager.prototype, "loop", null);
exports.constructionManager = new ConstructionManager;
