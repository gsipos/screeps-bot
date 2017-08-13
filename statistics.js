"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Statistics {
    constructor() {
        if (!this.stats) {
            Memory['statistics'] = {};
        }
    }
    get stats() {
        return Memory['statistics'];
    }
    getMetric(name) {
        if (!this.stats[name]) {
            this.stats[name] = {
                sum: 0,
                max: 0,
                min: Infinity,
                count: 0,
                avg: 0
            };
        }
        return this.stats[name];
    }
    metric(name, value) {
        const metric = this.getMetric(name);
        metric.sum += value;
        metric.min = Math.min(metric.min, value);
        metric.max = Math.max(metric.max, value);
        metric.count++;
        metric.avg = metric.sum / metric.count;
    }
}
exports.stats = new Statistics();
global.Stats = exports.stats;
