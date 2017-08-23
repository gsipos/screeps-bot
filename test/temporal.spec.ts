import { Temporal } from '../src/util';

declare var global: any;

describe('Temporal', () => {
  let value = 1;
  let temporal = new Temporal<number>(() => value++);

  beforeEach(() => {
    global.Game = {};
    global.Game.time = 1;
  });

  it('get returns value', () =>
    expect(temporal.get()).toBe(1));

  it('returns the same value in a single tick', () => {
    expect(value).toBe(2);
    expect(temporal.get()).toBe(1);
  });

  it('returns the new value after a clear', () => {
    temporal.clear();
    expect(temporal.get()).toBe(2);
  });

  it('returns the new value in the next tick', () => {
    Game.time = 2;
    expect(value).toBe(3);
    expect(temporal.get()).toBe(3);
  });

});
