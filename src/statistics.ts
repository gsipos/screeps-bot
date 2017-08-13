interface Metric {
  sum: number;
  min: number;
  max: number;
  count: number;
  avg: number;
  last50: number[];
  last50Avg: number;
}

interface MemoryStats {
  [metric: string]: Metric;
}

class Statistics {

  constructor() {
    if (!this.stats) {
      Memory['statistics'] = {};
    }
  }

  public get stats(): MemoryStats {
    return Memory['statistics'];
  }

  public getMetric(name: string): Metric {
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

  public metric(name: string, value: number) {
    const metric = this.getMetric(name);
    metric.sum += value;
    metric.min = Math.min(metric.min, value);
    metric.max = Math.max(metric.max, value);
    metric.count++;
    metric.avg = metric.sum / metric.count;
    metric.last50 = [value, ...(metric.last50 || []).slice(0, 48)];
    metric.last50Avg = metric.last50.reduce((a, b) => a + b, 0) / metric.last50.length;
  }

}

export const stats = new Statistics();

declare var global: any;
global.Stats = stats;
