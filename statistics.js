"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Statistics {
    constructor() {
        this.metricsToProcess = [];
        this.metricsToCalculate = new Set();
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
        metric.last50 = this.addToWindow(metric.last50, value, 50);
        return metric;
    }
    calculateMetric(metric) {
        metric.avg = metric.sum / metric.count;
        metric.last50Avg = metric.last50.reduce((a, b) => a + b, 0) / metric.last50.length;
    }
    addToWindow(items, newValue, windowSize) {
        let workItems = items || [];
        workItems.push(newValue);
        while (workItems.length > windowSize) {
            workItems.shift();
        }
        return workItems;
    }
    loop() {
        if (Game.cpu.bucket < 5000) {
            return;
        }
        const cpu = Game.cpu.getUsed();
        this.metric('Stat::entries', this.metricsToProcess.length);
        this.metricsToProcess
            .map(entry => this.storeMetric(entry.name, entry.value))
            .forEach(metric => this.metricsToCalculate.add(metric));
        this.metricsToCalculate.forEach(metric => this.calculateMetric(metric));
        this.metricsToProcess = [];
        this.metricsToCalculate.clear();
        this.storeMetric('Profile::Stat::loop', Game.cpu.getUsed() - cpu);
    }
    start() { this.gatheringStats = true; }
    stop() { this.gatheringStats = false; }
}
exports.stats = new Statistics();
global.Stats = exports.stats;
