const spawnManager = require('spawn').spawnManager;
const creepManager = require('creep').creepManager;
const towerManager = require('tower').towerManager;
const roomManager  = require('room').roomManager;

module.exports.loop = function () {

  for (var name in Memory.creeps) {
    if (!Game.creeps[name]) {
      delete Memory.creeps[name];
      console.log('Clearing non-existing creep memory:', name);
    }
  }

  roomManager.initRooms();
  spawnManager.loop();
  creepManager.loop();
  towerManager.loop();
}
