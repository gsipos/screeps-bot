const spawnManager = require('spawn').spawnManager;
const creepManager = require('creep').creepManager;
const carryCreepManager = require('creep.carry').carryCreepManager;
const minerCreepManager = require('creep.miner').minerCreepManager;
const towerManager = require('tower').towerManager;
const roomManager = require('room').roomManager;
const constructionManager = require('construction').constructionManager;
const data = require('data').data;
const profiler = require('profiler').profiler;
const reporter = require('reporter').reporter;
const stats = require('statistics').stats;

module.exports.loop = function () {
  profiler.trackMethod('Game::Start', Game.cpu.getUsed());
  profiler.tick();
  const done = profiler.track('Game loop');
  for (var name in Memory.creeps) {
    if (!Game.creeps[name]) {
      delete Memory.creeps[name];
      console.log('Clearing non-existing creep memory:', name);
    }
  }

  roomManager.initRooms();
  constructionManager.loop();
  spawnManager.loop();
  towerManager.loop();
  minerCreepManager.loop();
  carryCreepManager.loop();
  creepManager.loop();

  stats.loop();
  done();
}
