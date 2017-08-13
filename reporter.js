"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const statistics_1 = require("./statistics");
const data_1 = require("./data");
class Reporter {
    printProfile() {
        console.log(`Data       hit / miss: ${data_1.data.storeHit} / ${data_1.data.storeMiss} | Hit ratio: ${(data_1.data.storeHit / (data_1.data.storeHit + data_1.data.storeMiss)).toFixed(2)}`);
        console.log(`CachedData hit / miss: ${data_1.cachedData.storeHit} / ${data_1.cachedData.storeMiss} | Hit ratio: ${(data_1.cachedData.storeHit / (data_1.cachedData.storeHit + data_1.cachedData.storeMiss)).toFixed(2)}`);
        console.log(`PathStore  hit / miss / renewed: ${data_1.pathStore.storeHit} / ${data_1.pathStore.storeMiss} / ${data_1.pathStore.renewed} | Hit ratio: ${(data_1.pathStore.storeHit / (data_1.pathStore.storeHit + data_1.pathStore.storeMiss)).toFixed(2)}`);
    }
    printStat() {
        const separator = '\t\t| ';
        const f2 = (n) => n.toFixed(2);
        const pad = (s) => (s + '          ').substring(0, 10);
        console.log('----------------------------------------------');
        console.log(['Sum', 'Count', 'Min', 'Max', 'Avg', 'Name'].map(pad).join(separator));
        Object.keys(statistics_1.stats.stats).forEach(name => {
            const m = statistics_1.stats.stats[name];
            const metricString = [m.sum, m.count, m.min, m.max, m.avg].map(n => f2(n)).map(pad).join(separator);
            console.log(metricString + separator + name);
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
