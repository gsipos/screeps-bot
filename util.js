"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function findStructures(room, types, where = FIND_MY_STRUCTURES) {
    return room.find(where, { filter: (s) => types.indexOf(s.structureType) > -1 });
}
exports.findStructures = findStructures;
class Lazy {
    constructor(supplier) {
        this.supplier = supplier;
    }
    get() {
        if (!this.value) {
            this.value = this.supplier();
        }
        return this.value;
    }
    clear() {
        this.value = undefined;
    }
}
exports.Lazy = Lazy;
class Temporal {
    constructor(supplier) {
        this.supplier = supplier;
    }
    get() {
        if (!this.value || this.captureTime !== Game.time) {
            this.value = this.supplier();
            this.captureTime = Game.time;
        }
        return this.value;
    }
}
exports.Temporal = Temporal;
class TTL {
    constructor(ttl, supplier) {
        this.ttl = ttl;
        this.supplier = supplier;
    }
    get() {
        if (!this.value || this.old) {
            this.value = this.supplier();
            this.maxAge = Game.time + this.ttl;
        }
        return this.value;
    }
    get old() {
        return Game.time > this.maxAge;
    }
    clear() {
        this.value = undefined;
    }
}
exports.TTL = TTL;
function forEachRoom(call) {
    for (let roomName in Game.rooms) {
        call(Game.rooms[roomName]);
    }
}
exports.forEachRoom = forEachRoom;
