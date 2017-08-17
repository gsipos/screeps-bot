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
const util_1 = require("./util");
class ATTL {
    constructor(supplier) {
        this.supplier = supplier;
        this.metricId = 'ATTL';
        this.minTTL = 1;
        this.maxTTL = 100;
        this.ttl = this.minTTL;
        this.linearIncrementParameter = 0.5;
    }
    get() {
        if (this.stale || this.isEmpty()) {
            let newValue = this.getNewValue();
            this.adjustTTL(newValue);
            this.value = newValue;
            statistics_1.stats.metric(this.metricId + '::TTL', this.ttl);
            this.maxAge = Game.time + this.ttl;
        }
        else {
            statistics_1.stats.metric(this.metricId + '::hit', 1);
        }
        return this.value;
    }
    getNewValue() {
        let newValue = undefined;
        try {
            newValue = profiler_1.profiler.wrap(this.metricId + '::Supplier', this.supplier);
        }
        catch (e) {
            console.log('Caught in ' + this.metricId, e);
        }
        return newValue;
    }
    adjustTTL(newValue) {
        if (this.valueEquals(this.value, newValue)) {
            this.ttl = this.nextTTL(this.ttl, newValue);
            statistics_1.stats.metric(this.metricId + '::TTL-increment', this.ttl);
        }
        else {
            statistics_1.stats.metric(this.metricId + '::TTL-reset', this.ttl);
            this.ttl = this.minTTL;
        }
    }
    isEmpty() {
        return this.value === null || this.value === undefined;
    }
    valueEquals(old, fresh) {
        return old === fresh;
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
class ArrayAdaptiveTTLCache extends ATTL {
    constructor() {
        super(...arguments);
        this.metricId = 'AATTL';
        this._calulatedValue = new util_1.Temporal(() => (this.valueIds || []).map(id => Game.getObjectById(id)));
    }
    get value() {
        return this._calulatedValue.get();
    }
    set value(newValue) {
        this.valueIds = newValue.map(i => i.id || i.name);
        this._calulatedValue.clear();
    }
    valueEquals(old, fresh) {
        if (!old)
            return false;
        if (!fresh)
            return false;
        if (!this.valueIds)
            return false;
        if (old.length !== fresh.length)
            return false;
        const freshIds = fresh.map(f => f.id || f.name);
        return this.valueIds.every(id => freshIds.includes(id));
    }
    isEmpty() {
        if (!this.value)
            return true;
        return this.value.some(i => i === undefined || i === null);
    }
}
exports.ArrayAdaptiveTTLCache = ArrayAdaptiveTTLCache;
