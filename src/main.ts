import { spawnManager } from "./spawn";
import { profiler } from "./telemetry/profiler";
import { roomManager } from "./room";
import { constructionManager } from "./construction";
import { towerManager } from "./tower";
import { minerCreepManager } from "./creep/creep.miner";
import { carryCreepManager } from "./creep/creep.carry";
import { creepManager } from "./creep/creep";
import { messaging } from "./messaging";
import { efficiency } from "./telemetry/efficiency";
import { stats } from "./telemetry/statistics";
import { reporter } from "./telemetry/reporter";
import { geographer } from "./room/geographer";
import { harasserCreepManager } from "./creep/creep.harasser";
import { remoteMinerCreepManager } from "./creep/creep.remoteminer";
import { roomPlanner } from "./construction/room-planner";

export const loop = function() {
  profiler.trackMethod("Game::Start", Game.cpu.getUsed());
  profiler.tick();
  const trackId = profiler.track("Game loop");
  for (var name in Memory.creeps) {
    if (!Game.creeps[name]) {
      delete Memory.creeps[name];
      console.log("Clearing non-existing creep memory:", name);
    }
  }

  roomManager.initRooms();
  roomPlanner.loop();
  geographer.loop();
  constructionManager.loop();

  spawnManager.loop();
  towerManager.loop();

  minerCreepManager.loop();
  carryCreepManager.loop();
  harasserCreepManager.loop();
  remoteMinerCreepManager.loop();
  creepManager.loop();

  messaging.loop();

  efficiency.loop();
  stats.loop();
  reporter.loop();
  profiler.finish(trackId);
};
