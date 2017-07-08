const spawnManager = require('dist/spawn').spawnManager;
const creepManager = require('dist/creep').creepManager;

module.exports.loop = function () {

  for (var name in Memory.creeps) {
    if (!Game.creeps[name]) {
      delete Memory.creeps[name];
      console.log('Clearing non-existing creep memory:', name);
    }
  }

  spawnManager.loop();
  creepManager.loop();
}
