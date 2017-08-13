"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const statistics_1 = require("./statistics");
class Reporter {
    printStat() {
        const separator = '\t\t| ';
        const f2 = (n) => (n || 0).toFixed(2);
        const pad = (s) => (s + '          ').substring(0, 10);
        console.log('----------------------------------------------');
        console.log(['Sum', 'Count', 'Min', 'Max', 'Avg', '50Avg', 'Name'].map(pad).join(separator));
        Object
            .keys(statistics_1.stats.stats)
            .sort((a, b) => a.localeCompare(b))
            .forEach(name => {
            const m = statistics_1.stats.stats[name];
            const metricString = [m.sum, m.count, m.min, m.max, m.avg, m.last50Avg].map(n => f2(n)).map(pad).join(separator);
            console.log(metricString + separator + name);
        });
        console.log('----------------------------------------------');
    }
    print() {
        this.printStat();
    }
}
exports.reporter = new Reporter();
global.Reporter = exports.reporter;
