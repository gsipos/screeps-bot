"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const profiler_1 = require("./profiler");
const data_1 = require("./data");
class TowerManager {
    loop() {
        for (let name in Game.rooms) {
            const room = Game.rooms[name];
            const roomData = data_1.data.of(room);
            const towers = roomData.towers.get();
            const closestHostile = towers[0].pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if (closestHostile) {
                towers.forEach(t => t.attack(closestHostile));
                return;
            }
            const decayingRampart = roomData.ramparts.get().find(r => r.hits < 500);
            if (decayingRampart) {
                towers.forEach(t => t.repair(decayingRampart));
                return;
            }
            const damagedStructure = roomData.nonDefensiveStructures.get().find(s => s.hits < s.hitsMax);
            if (damagedStructure) {
                towers.forEach(t => t.repair(damagedStructure));
                return;
            }
            const damagedCreep = roomData.creeps.get().find(c => c.hits < c.hitsMax);
            if (!!damagedCreep) {
                towers.forEach(t => t.heal(damagedCreep));
                return;
            }
        }
    }
}
__decorate([
    profiler_1.Profile('Tower')
], TowerManager.prototype, "loop", null);
exports.towerManager = new TowerManager();
