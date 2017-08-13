import { profiler } from './profiler';
import { stats } from './statistics';
import { data, cachedData, pathStore } from './data';

class Reporter {

  public printProfile() {
    console.log(`Data       hit / miss: ${data.storeHit} / ${data.storeMiss} | Hit ratio: ${(data.storeHit / (data.storeHit + data.storeMiss)).toFixed(2)}`);
    console.log(`CachedData hit / miss: ${cachedData.storeHit} / ${cachedData.storeMiss} | Hit ratio: ${(cachedData.storeHit / (cachedData.storeHit + cachedData.storeMiss)).toFixed(2)}`);
    console.log(`PathStore  hit / miss / renewed: ${pathStore.storeHit} / ${pathStore.storeMiss} / ${pathStore.renewed} | Hit ratio: ${(pathStore.storeHit / (pathStore.storeHit + pathStore.storeMiss)).toFixed(2)}`);
  }

  public printStat() {
    const separator = '\t\t| ';
    const f2 = (n: number) => n.toFixed(2);
    const pad = (s: string) => (s + '          ').substring(0, 10);
    console.log('----------------------------------------------');
    console.log(['Sum','Count','Min','Max','Avg','Name'].map(pad).join(separator));
    Object.keys(stats.stats).forEach(name => {
      const m = stats.stats[name];
      const metricString = [m.sum, m.count, m.min, m.max, m.avg].map(n => f2(n)).map(pad).join(separator);
      console.log(metricString + separator + name);
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
