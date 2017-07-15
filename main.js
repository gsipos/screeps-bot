const spawnManager = require('spawn').spawnManager;
const creepManager = require('creep').creepManager;
const carryCreepManager = require('creep.carry').carryCreepManager;
const minerCreepManager = require('creep.miner').minerCreepManager;
const towerManager = require('tower').towerManager;
const roomManager = require('room').roomManager;
const constructionManager = require('construction').constructionManager;

module.exports.loop = function () {

  for (var name in Memory.creeps) {
    if (!Game.creeps[name]) {
      delete Memory.creeps[name];
      console.log('Clearing non-existing creep memory:', name);
    }
  }

  roomManager.initRooms();
  constructionManager.loop();
  spawnManager.loop();
  minerCreepManager.loop();
  carryCreepManager.loop();
  creepManager.loop();
  towerManager.loop();
}
