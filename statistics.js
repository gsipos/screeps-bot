"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Statistics {
    constructor() {
        this.metricsToProcess = [];
        if (!this.stats) {
            Memory['statistics'] = {};
        }
    }
    get stats() {
        return Memory['statistics'];
    }
    get gatheringStats() { return Memory['gatheringStats']; }
    set gatheringStats(gathering) { Memory['gatheringStats'] = gathering; }
    getMetric(name) {
        if (!this.stats[name]) {
            this.stats[name] = {
                sum: 0,
                max: 0,
                min: Infinity,
                count: 0,
                avg: 0,
                last50: [],
                last50Avg: 0
            };
        }
        return this.stats[name];
    }
    metric(name, value) {
        if (!this.gatheringStats) {
            return;
        }
        this.metricsToProcess.push({ name, value });
    }
    storeMetric(name, value) {
        const metric = this.getMetric(name);
        metric.sum += value;
        metric.min = Math.min(metric.min, value);
        metric.max = Math.max(metric.max, value);
        metric.count++;
        metric.avg = metric.sum / metric.count;
        metric.last50 = [value, ...(metric.last50 || []).slice(0, 48)];
        metric.last50Avg = metric.last50.reduce((a, b) => a + b, 0) / metric.last50.length;
    }
    loop() {
        if (Game.cpu.bucket < 500) {
            return;
        }
        const cpu = Game.cpu.getUsed();
        this.metric('Stat::entries', this.metricsToProcess.length);
        this.metricsToProcess.forEach(entry => this.storeMetric(entry.name, entry.value));
        this.metricsToProcess = [];
        this.storeMetric('Profile::Stat::loop', Game.cpu.getUsed() - cpu);
    }
    start() { this.gatheringStats = true; }
    stop() { this.gatheringStats = false; }
}
exports.stats = new Statistics();
global.Stats = exports.stats;
