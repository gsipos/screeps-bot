declare var global: any;
global.Memory = {};

import { CreepMovement } from '../src/creep.movement';


describe('CreepMovement', () => {
  let movement: CreepMovement;
  beforeEach(() => {
    global.Game = {};
    global.Game.time = 5;
    movement = new CreepMovement();
  });

  describe('isStuck Creep', () => {
    it('is stuck if it is in the same position for a long time', () =>
      expect(movement.isStuck({ memory: { posSince: 1 } } as any)).toBeTruthy());

    it('is not stuck if it moves', () =>
      expect(movement.isStuck({ memory: { posSince: 4 } } as any)).toBeFalsy());
  });

});
