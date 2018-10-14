import { Profile } from "./telemetry/profiler";
import { stats } from "./telemetry/statistics";

interface Message {
  type: string;
  value: string;
}

interface InternalMessage extends Message {
  source: string;
  consumed: string[];
  maxAge: number;
}

export class Messaging {
  private readonly nodeId: string = this.generateId();

  constructor() {
    if (!Memory.messages) Memory.messages = [];
  }

  private get messages(): InternalMessage[] { return Memory.messages; }

  private generateId() {
    return [
      (Math.random() * 1000).toFixed(0),
      (Math.random() * 1000).toFixed(0),
      (Math.random() * 1000).toFixed(0),
    ].join('-');
  }

  public consumeMessages(type: string): Message[] {
    return this.messages
      .filter(m => m.source != this.nodeId)
      .filter(m => !m.consumed.includes(this.nodeId))
      .map(m => {
        m.consumed.push(this.nodeId);
        return m;
      });
  }

  public send(type: string, value: string) {
    stats.metric('Messaging:sent', 1);
    this.messages.push({
      type,
      value,
      maxAge: Game.time + 100,
      source: this.nodeId,
      consumed: []
    });
  }

  @Profile('Messaging')
  public loop() {
    Memory.messages = this.messages
      .filter(this.lessThan4Consumers)
      .filter(this.tooOld);
  }

  private lessThan4Consumers = (m: InternalMessage) => m.consumed.length < 4;
  private tooOld = (m: InternalMessage) => m.maxAge < Game.time;
}

export const messaging = new Messaging();
