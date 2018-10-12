import { Profile, profiler } from '../telemetry/profiler';
import { stats } from '../telemetry/statistics';
import { Temporal } from "../util";

export class ATTL<Value> {
  protected metricId = 'ATTL';
  protected value: Value | undefined;

  private maxAge: number = Game.time - 1;

  private readonly minTTL = 1;
  private readonly maxTTL = 100;
  private ttl: number = this.minTTL;

  private linearIncrementParameter = 0.5;

  constructor( private supplier: () => Value) { }

  @Profile('ATTL')
  public get(): Value {
    if (this.stale || this.isEmpty()) {

      let newValue = this.getNewValue();

      this.adjustTTL(newValue);

      this.value = newValue;

      stats.metric(this.metricId+'::TTL', this.ttl);
      this.maxAge = Game.time + this.ttl;

    } else {
      stats.metric(this.metricId +'::hit', 1);
    }
    return this.value as Value;
  }

  private getNewValue() {
    let newValue: Value | undefined = undefined;
    try {
      newValue = profiler.wrap(this.metricId +'::Supplier', this.supplier);
    } catch (e) {
      console.log('Caught in '+this.metricId, e);
    }
    return newValue;
  }

  private adjustTTL(newValue: Value | undefined) {
    if (this.valueEquals(this.value, newValue)) {
      this.ttl = this.nextTTL(this.ttl, newValue);
      stats.metric(this.metricId +'::TTL-increment', this.ttl);
    } else {
      stats.metric(this.metricId +'::TTL-reset', this.ttl);
      this.ttl = this.minTTL;
    }
  }

  protected isEmpty() {
    return this.value === null || this.value === undefined;
  }

  protected valueEquals(old: Value | undefined, fresh: Value | undefined): boolean {
    return old === fresh;
  }

  private get stale() {
    return Game.time > this.maxAge;
  }

  public clear() {
    this.maxAge = Game.time - 1;
  }

  private linearIncrementTTL(previousTTL: number): number {
    return previousTTL + Math.ceil(this.linearIncrementParameter * previousTTL);
  }

  private calcMaxTTL(value: Value | undefined): number {
    if (value instanceof Array) {
      if (value.length) {
        const first = value[0];
        if (first.ticksToLive) {
          return Math.min(this.maxTTL, ...value.map(i => i.ticksToLive));
        }
        if (first.tickToDecay) {
          return Math.min(this.maxTTL, ...value.map(i => i.ticksToDecay));
        }
      }
    }
    return this.maxTTL;
  }

  private nextTTL(previousTTL: number, value: Value | undefined) {
    return Math.min(this.calcMaxTTL(value), this.linearIncrementTTL(previousTTL));
  }

  private toString() {
    return '' + this.value + '|' + this.ttl;
  }

}

export interface HasId {
  id?: string;
  name?: string;
}

export class ArrayAdaptiveTTLCache<T extends HasId> extends ATTL<T[]> {
  protected metricId = 'AATTL';

  private valueIds: string[] = [];
  private _calulatedValue = new Temporal<T[]>(() => (this.valueIds || []).map(id => Game.getObjectById<T>(id) as T));

  protected get value() {
    return this._calulatedValue.get();
  }

  protected set value(newValue: T[]) {
    this.valueIds = newValue.map(i => i.id || i.name as string);
    this._calulatedValue.clear();
  }

  protected valueEquals(old: T[] | undefined, fresh: T[] | undefined) {
    if (!old) return false;
    if (!fresh) return false;
    if (!this.valueIds) return false;
    if (old.length !== fresh.length) return false;
    const freshIds = fresh.map(f => f.id || f.name);
    return this.valueIds.every(id => freshIds.includes(id));
  }

  protected isEmpty() {
    if (!this.value) return true;
    return this.value.some(i => i === undefined || i === null);
  }

}
