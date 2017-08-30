"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const profiler_1 = require("./profiler");
function findStructures(room, types, where = FIND_MY_STRUCTURES) {
    return room.find(where, { filter: (s) => types.indexOf(s.structureType) > -1 });
}
exports.findStructures = findStructures;
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
exports.getRandomInt = getRandomInt;
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
            this.value = profiler_1.profiler.wrap('Temporal::supplier', this.supplier);
            this.captureTime = Game.time;
        }
        return this.value;
    }
    clear() {
        this.value = undefined;
    }
}
__decorate([
    profiler_1.Profile('Temporal')
], Temporal.prototype, "get", null);
exports.Temporal = Temporal;
class TTL {
    constructor(ttl, supplier) {
        this.ttl = ttl;
        this.supplier = supplier;
    }
    get() {
        if (this.emptyValue || this.old || this.arrayValueHasNullOrUndefinedItem) {
            try {
                this.value = this.supplier();
            }
            catch (e) {
                console.log('Caught in TTL', e);
            }
            this.maxAge = Game.time + this.ttl;
            TTL.miss++;
        }
        else {
            TTL.hit++;
        }
        return this.value;
    }
    get emptyValue() {
        return this.value === null || this.value === undefined;
    }
    get arrayValueHasNullOrUndefinedItem() {
        if (this.value instanceof Array) {
            return this.value.some(item => item === null || item === undefined);
        }
        else {
            return false;
        }
    }
    get old() {
        return Game.time > this.maxAge;
    }
    clear() {
        this.value = undefined;
    }
}
TTL.hit = 0;
TTL.miss = 0;
exports.TTL = TTL;
function forEachRoom(call) {
    for (let roomName in Game.rooms) {
        try {
            call(Game.rooms[roomName]);
        }
        catch (e) {
            console.log(e);
        }
    }
}
exports.forEachRoom = forEachRoom;
