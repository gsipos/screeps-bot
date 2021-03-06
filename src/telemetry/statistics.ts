interface Metric {
  sum: number;
  min: number;
  max: number;
  count: number;
  avg: number;
  last50: number[];
  last50Avg: number;
}

type MemoryStats = Record<string, Metric>;

class Statistics {
  public metricsToProcess: { name: string, value: number }[] = [];
  public metricsToCalculate = new Set<Metric>();

  constructor() {
    if (!this.stats) {
      Memory['statistics'] = {};
    }
  }

  public get stats(): MemoryStats {
    return Memory['statistics'];
  }

  public get gatheringStats() { return Memory['gatheringStats']; }
  public set gatheringStats(gathering: boolean) { Memory['gatheringStats'] = gathering;}

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
    if (!this.gatheringStats) {
      return;
    }
    this.metricsToProcess.push({ name, value });
  }

  public storeMetric(name: string, value: number) {
    const metric = this.getMetric(name);
    metric.sum += value;
    metric.min = Math.min(metric.min, value);
    metric.max = Math.max(metric.max, value);
    metric.count++;
    metric.last50 = this.addToWindow(metric.last50, value, 50);
    return metric;
  }

  private sum = (a: number, b: number) => a + b;

  public calculateMetric = (metric: Metric) => {
    metric.avg = metric.sum / metric.count;
    metric.last50Avg = metric.last50.reduce(this.sum, 0) / metric.last50.length;
  }

  private addToWindow<T>(items: T[] | undefined, newValue: T, windowSize: number) {
    let workItems = items || [];
    workItems.push(newValue);
    while (workItems.length > windowSize) {
      workItems.shift();
    }
    return workItems;
  }

  public loop() {
    if (Game.cpu.bucket < 5000) {
      return;
    }
    const cpu = Game.cpu.getUsed();
    this.metric('Stat::entries', this.metricsToProcess.length);
    this.metricsToProcess
      .map(entry => this.storeMetric(entry.name, entry.value))
      .forEach(metric => this.metricsToCalculate.add(metric));
    this.metricsToCalculate.forEach(this.calculateMetric);
    this.metricsToProcess = [];
    this.metricsToCalculate.clear();
    this.storeMetric('Profile::Stat::loop', Game.cpu.getUsed() - cpu);
  }

  public start() { this.gatheringStats = true; }
  public stop() { this.gatheringStats = false; }

}

export const stats = new Statistics();

declare var global: any;
global.Stats = stats;
