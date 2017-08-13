import { profiler } from './profiler';
import { stats } from './statistics';
import { data, cachedData, pathStore } from './data';

class Reporter {

  public printStat() {
    const separator = '\t\t| ';
    const f2 = (n: number) => (n||0).toFixed(2);
    const pad = (s: string) => (s + '          ').substring(0, 10);
    console.log('----------------------------------------------');
    console.log(['Sum', 'Count', 'Min', 'Max', 'Avg', '50Avg', 'Name'].map(pad).join(separator));
    Object
      .keys(stats.stats)
      .sort((a, b) => a.localeCompare(b))
      .forEach(name => {
        const m = stats.stats[name];
        const metricString = [m.sum, m.count, m.min, m.max, m.avg, m.last50Avg].map(n => f2(n)).map(pad).join(separator);
        console.log(metricString + separator + name);
      });

    console.log('----------------------------------------------');
  }

  public print() {
    this.printStat();
  }
}

export const reporter = new Reporter();

declare var global: any;
global.Reporter = reporter;
