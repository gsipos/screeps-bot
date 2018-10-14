import { stats } from "./statistics";
import { Interval } from "../util";

class Reporter {
  private f2 = (n: number) => (n || 0).toFixed(2);
  private pad = (s: string) => (s + "          ").substring(0, 10);
  private separator = "\t\t| ";
  private longSeparator = "----------------------------------------------";

  private headerString = ["Sum", "Count", "Min", "Max", "Avg", "50Avg", "Name"]
    .map(this.pad)
    .join(this.separator);

  private createMetricString = (name: string) => {
    const m = stats.stats[name];
    const metricString = [m.sum, m.count, m.min, m.max, m.avg, m.last50Avg]
      .map(this.f2)
      .map(this.pad)
      .join(this.separator);
    return metricString + this.separator + name;
  };

  private createStatReportLines = () => [
    this.longSeparator,
    this.headerString,
    ...Object.keys(stats.stats)
      .sort((a, b) => a.localeCompare(b))
      .map(this.createMetricString),
    this.longSeparator
  ];

  public print() {
    this.createStatReportLines().map(s => console.log(s));
  }

  public emailReport = () => {
    const lines = this.createStatReportLines();

    const chunks: string[][] = [];
    let currentChunk: string[] = [];
    let currentChunkLength = 0;

    lines.forEach(line => {
      if (currentChunkLength + line.length > 900) {
        chunks.push(currentChunk);
        currentChunk = [line];
        currentChunkLength = line.length;
      } else {
        currentChunk.push(line);
        currentChunkLength += line.length;
      }
    });

    chunks.map(c => c.join("\n")).forEach(c => Game.notify(c, 180));
  }

  private notifyScheduler = new Interval(22_000, this.emailReport);

  public loop() {
    this.notifyScheduler.run();
  }
}

export const reporter = new Reporter();

declare var global: any;
global.Reporter = reporter;
