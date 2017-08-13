interface Metric {
  sum: number;
  min: number;
  max: number;
  count: number;
  avg: number;
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
        avg: 0
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
  }

}

export const stats = new Statistics();

declare var global: any;
global.Stats = stats;
