import { Temporal } from "./temporal";
import { ATTL } from "./adaptive.ttl";

export interface HasId {
  id?: string;
  name?: string;
}

export class AdaptiveArrayTTLCache<T extends HasId> extends ATTL<T[]> {
  protected metricId = "AATTL";

  private valueIds: string[] = [];
  private _calulatedValue = new Temporal<T[]>(() =>
    (this.valueIds || []).map(id => Game.getObjectById<T>(id) as T)
  );

  protected get value() {
    return this._calulatedValue.get();
  }

  protected set value(newValue: T[]) {
    this.valueIds = newValue.map(i => i.id || (i.name as string));
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
