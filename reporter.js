"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const statistics_1 = require("./statistics");
const data_1 = require("./data");
class Reporter {
    printProfile() {
        const entries = Object.keys(Memory.profileMethod).map(name => ({
            name: name,
            calls: Memory.profile[name + '_call'],
            cpu: Memory.profile[name + '_cpu'],
            min: Memory.profile[name + '_min'],
            max: Memory.profile[name + '_max'],
        }));
        console.log('----------------------------------------------');
        console.log('| Name | Total Calls | Total CPU | Avg. Cpu | Avg Calls/Tick | Min | Max');
        entries.forEach(e => console.log(`| ${e.name} | ${e.calls} | ${e.cpu.toFixed(2)} | ${(e.cpu / e.calls).toFixed(2)} | ${(e.calls / Memory.profileTicks).toFixed(2)} | ${e.min.toFixed(2)} | ${e.max.toFixed(2)}`));
        console.log('----------------------------------------------');
        console.log(`Data       hit / miss: ${data_1.data.storeHit} / ${data_1.data.storeMiss} | Hit ratio: ${(data_1.data.storeHit / (data_1.data.storeHit + data_1.data.storeMiss)).toFixed(2)}`);
        console.log(`CachedData hit / miss: ${data_1.cachedData.storeHit} / ${data_1.cachedData.storeMiss} | Hit ratio: ${(data_1.cachedData.storeHit / (data_1.cachedData.storeHit + data_1.cachedData.storeMiss)).toFixed(2)}`);
        console.log(`PathStore  hit / miss / renewed: ${data_1.pathStore.storeHit} / ${data_1.pathStore.storeMiss} / ${data_1.pathStore.renewed} | Hit ratio: ${(data_1.pathStore.storeHit / (data_1.pathStore.storeHit + data_1.pathStore.storeMiss)).toFixed(2)}`);
    }
    printStat() {
        const f2 = (n) => n.toFixed(2);
        console.log('----------------------------------------------');
        Object.keys(statistics_1.stats.stats).forEach(name => {
            const m = statistics_1.stats.stats[name];
            const metricString = [m.sum, m.count, m.min, m.max, m.avg].map(n => f2(n)).join('\t|\t');
            console.log(metricString + '\t|\t' + name);
        });
        console.log('----------------------------------------------');
    }
    print() {
        this.printProfile();
        this.printStat();
    }
}
exports.reporter = new Reporter();
global.Reporter = exports.reporter;
