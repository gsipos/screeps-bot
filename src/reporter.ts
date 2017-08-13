import { profiler } from './profiler';
import { stats } from './statistics';
import { data, cachedData, pathStore } from './data';

class Reporter {

  public printProfile() {
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
    console.log(`Data       hit / miss: ${data.storeHit} / ${data.storeMiss} | Hit ratio: ${(data.storeHit / (data.storeHit + data.storeMiss)).toFixed(2)}`);
    console.log(`CachedData hit / miss: ${cachedData.storeHit} / ${cachedData.storeMiss} | Hit ratio: ${(cachedData.storeHit / (cachedData.storeHit + cachedData.storeMiss)).toFixed(2)}`);
    console.log(`PathStore  hit / miss / renewed: ${pathStore.storeHit} / ${pathStore.storeMiss} / ${pathStore.renewed} | Hit ratio: ${(pathStore.storeHit / (pathStore.storeHit + pathStore.storeMiss)).toFixed(2)}`);

  }

  public printStat() {
    const f2 = (n: number) => n.toFixed(2);
    console.log('----------------------------------------------');

    Object.keys(stats.stats).forEach(name => {
      const m = stats.stats[name];
      const metricString = [m.sum, m.count, m.min, m.max, m.avg].map(n => f2(n)).join('\t|\t');
      console.log(metricString + '\t|\t' + name);
    });

    console.log('----------------------------------------------');
  }

  public print() {
    this.printProfile();
    this.printStat();
  }
}

export const reporter = new Reporter();

declare var global: any;
global.Reporter = reporter;
