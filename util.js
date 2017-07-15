"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function findStructures(room, types, where = FIND_MY_STRUCTURES) {
    return room.find(where, { filter: (s) => types.indexOf(s.structureType) > -1 });
}
exports.findStructures = findStructures;
