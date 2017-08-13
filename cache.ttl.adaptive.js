"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const profiler_1 = require("./profiler");
const statistics_1 = require("./statistics");
class ATTL {
    constructor(supplier) {
        this.supplier = supplier;
        this.minTTL = 1;
        this.maxTTL = 2000;
        this.ttl = this.minTTL;
        this.linearIncrementParameter = 0.5;
    }
    get() {
        if (this.emptyValue || this.stale || this.arrayValueHasEmptyOrUnkownItem) {
            let newValue = undefined;
            try {
                newValue = profiler_1.profiler.wrap('ATTL::Supplier', this.supplier);
            }
            catch (e) {
                console.log('Caught in ATTL', e);
            }
            if (this.valueEquals(this.value, newValue)) {
                this.ttl = this.nextTTL(this.ttl, newValue);
                statistics_1.stats.metric('ATTL::TTL-increment', this.ttl);
            }
            else {
                statistics_1.stats.metric('ATTL::TTL-reset', this.ttl);
                this.ttl = this.minTTL;
            }
            this.value = newValue;
            statistics_1.stats.metric('ATTL::TTL', this.ttl);
            this.maxAge = Game.time + this.ttl;
        }
        else {
            statistics_1.stats.metric('ATTL::hit', 1);
        }
        return this.value;
    }
    get emptyValue() {
        return this.value === null || this.value === undefined;
    }
    get arrayValueHasEmptyOrUnkownItem() {
        if (this.value instanceof Array) {
            return this.value.some(item => item === null
                || item === undefined
                || !Game.getObjectById(item.id || item.name));
        }
        else {
            return false;
        }
    }
    valueEquals(old, fresh) {
        if (old === fresh) {
            return true;
        }
        if (old === undefined || old === null) {
            return false;
        }
        if (old instanceof Array && fresh instanceof Array) {
            if (old.length !== fresh.length)
                return false;
            const oldIds = old.map(o => o.id || o.name);
            const freshIds = fresh.map(f => f.id || f.name);
            return freshIds.every(e => oldIds.includes(e))
                && oldIds.every(e => freshIds.includes(e));
        }
        return false;
    }
    get stale() {
        return Game.time > this.maxAge;
    }
    clear() {
        this.maxAge = Game.time - 1;
    }
    linearIncrementTTL(previousTTL) {
        return previousTTL + Math.ceil(this.linearIncrementParameter * previousTTL);
    }
    calcMaxTTL(value) {
        if (value instanceof Array) {
            if (value.length) {
                const first = value[0];
                if (first.ticksToLive) {
                    return Math.min(this.maxTTL, ...value.map(i => i.ticksToLive));
                }
                if (first.tickToDecay) {
                    return Math.min(this.maxTTL, ...value.map(i => i.ticksToDecay));
                }
            }
        }
        return this.maxTTL;
    }
    nextTTL(previousTTL, value) {
        return Math.min(this.calcMaxTTL(value), this.linearIncrementTTL(previousTTL));
    }
    toString() {
        return '' + this.value + '|' + this.ttl;
    }
}
__decorate([
    profiler_1.Profile('ATTL')
], ATTL.prototype, "get", null);
exports.ATTL = ATTL;
