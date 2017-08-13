import { Profile, profiler } from './profiler';
import { stats } from './statistics';

export class ATTL<Value> {
  private value: Value | undefined;
  private maxAge: number;

  private readonly minTTL = 1;
  private readonly maxTTL = 2000;
  private ttl: number = this.minTTL;

  private linearIncrementParameter = 0.5;

  constructor( private supplier: () => Value) { }

  @Profile('ATTL')
  public get(): Value {
    if (this.emptyValue || this.stale || this.arrayValueHasNullOrUndefinedItem) {
      let newValue: Value | undefined = undefined;
      try {
        newValue = profiler.wrap('ATTL::Supplier', this.supplier);
      } catch (e) {
        console.log('Caught in ATTL', e);
      }
      if (this.valueEquals(this.value, newValue)) {
        this.ttl = this.nextTTL(this.ttl, newValue);
      } else {
        this.ttl = this.minTTL;
      }
      this.value = newValue;
      stats.metric('ATTL::TTL', this.ttl);
      stats.metric('ATTL::miss', 1);
      this.maxAge = Game.time + this.ttl;
    } else {
      stats.metric('ATTL::hit', 1);
    }
    return this.value as Value;
  }

  private get emptyValue() {
    return this.value === null || this.value === undefined;
  }

  private get arrayValueHasNullOrUndefinedItem(): boolean {
    if (this.value instanceof Array) {
      return this.value.some(item => item === null || item === undefined);
    } else {
      return false;
    }
  }

  private valueEquals(old: Value | undefined, fresh: Value | undefined): boolean {
    if (old === fresh) {
      return true;
    }
    if (old === undefined || old === null) {
      return false;
    }
    if (old instanceof Array && fresh instanceof Array) {
      return old.length === fresh.length;
    }
    return false;
  }

  private get stale() {
    return Game.time > this.maxAge;
  }

  public clear() {
    this.value = undefined;
    this.ttl = this.minTTL;
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
