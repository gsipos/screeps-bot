import { spawnManager } from "./spawn";
import { profiler } from "./telemetry/profiler";
import { roomManager } from "./room";
import { constructionManager } from "./construction";
import { towerManager } from "./tower";
import { minerCreepManager } from "./creep/creep.miner";
import { carryCreepManager } from "./creep/creep.carry";
import { creepManager } from "./creep/creep";
import { messaging } from "./messaging";
import { creepMovement } from "./creep/creep.movement";
import { efficiency } from "./telemetry/efficiency";
import { stats } from "./telemetry/statistics";
import './telemetry/reporter';

export const loop = function () {
  profiler.trackMethod('Game::Start', Game.cpu.getUsed());
  profiler.tick();
  const trackId = profiler.track('Game loop');
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
  messaging.loop();
  creepMovement.loop();

  efficiency.loop();
  stats.loop();

  profiler.finish(trackId);
}
