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
class Messaging {
    constructor() {
        this.nodeId = this.generateId();
        if (!Memory.messages)
            Memory.messages = [];
    }
    get messages() { return Memory.messages; }
    generateId() {
        return [
            (Math.random() * 1000).toFixed(0),
            (Math.random() * 1000).toFixed(0),
            (Math.random() * 1000).toFixed(0),
        ].join('-');
    }
    consumeMessages(type) {
        return this.messages
            .filter(m => m.source != this.nodeId)
            .filter(m => !m.consumed.includes(this.nodeId))
            .map(m => {
            m.consumed.push(this.nodeId);
            return m;
        });
    }
    send(type, value) {
        statistics_1.stats.metric('Messaging:sent', 1);
        this.messages.push({
            type,
            value,
            maxAge: Game.time + 100,
            source: this.nodeId,
            consumed: []
        });
    }
    loop() {
        Memory.messages = this.messages
            .filter(m => m.consumed.length < 4)
            .filter(m => m.maxAge < Game.time);
    }
}
__decorate([
    profiler_1.Profile('Messaging')
], Messaging.prototype, "loop", null);
exports.Messaging = Messaging;
exports.messaging = new Messaging();
