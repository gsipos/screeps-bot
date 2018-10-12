// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

// eslint-disable-next-line no-global-assign
var parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  return newRequire;
})({"KIzw":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

class Statistics {
  constructor() {
    this.metricsToProcess = [];
    this.metricsToCalculate = new Set();

    if (!this.stats) {
      Memory['statistics'] = {};
    }
  }

  get stats() {
    return Memory['statistics'];
  }

  get gatheringStats() {
    return Memory['gatheringStats'];
  }

  set gatheringStats(gathering) {
    Memory['gatheringStats'] = gathering;
  }

  getMetric(name) {
    if (!this.stats[name]) {
      this.stats[name] = {
        sum: 0,
        max: 0,
        min: Infinity,
        count: 0,
        avg: 0,
        last50: [],
        last50Avg: 0
      };
    }

    return this.stats[name];
  }

  metric(name, value) {
    if (!this.gatheringStats) {
      return;
    }

    this.metricsToProcess.push({
      name,
      value
    });
  }

  storeMetric(name, value) {
    const metric = this.getMetric(name);
    metric.sum += value;
    metric.min = Math.min(metric.min, value);
    metric.max = Math.max(metric.max, value);
    metric.count++;
    metric.last50 = this.addToWindow(metric.last50, value, 50);
    return metric;
  }

  calculateMetric(metric) {
    metric.avg = metric.sum / metric.count;
    metric.last50Avg = metric.last50.reduce((a, b) => a + b, 0) / metric.last50.length;
  }

  addToWindow(items, newValue, windowSize) {
    let workItems = items || [];
    workItems.push(newValue);

    while (workItems.length > windowSize) {
      workItems.shift();
    }

    return workItems;
  }

  loop() {
    if (Game.cpu.bucket < 5000) {
      return;
    }

    const cpu = Game.cpu.getUsed();
    this.metric('Stat::entries', this.metricsToProcess.length);
    this.metricsToProcess.map(entry => this.storeMetric(entry.name, entry.value)).forEach(metric => this.metricsToCalculate.add(metric));
    this.metricsToCalculate.forEach(metric => this.calculateMetric(metric));
    this.metricsToProcess = [];
    this.metricsToCalculate.clear();
    this.storeMetric('Profile::Stat::loop', Game.cpu.getUsed() - cpu);
  }

  start() {
    this.gatheringStats = true;
  }

  stop() {
    this.gatheringStats = false;
  }

}

exports.stats = new Statistics();
global.Stats = exports.stats;
},{}],"m431":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const statistics_1 = require("./statistics");

class Profiler {
  constructor() {
    this.noop = () => undefined;

    if (!Memory.profileMethod) {
      Memory.profileMethod = {};
    }

    if (!Memory.profileTicks) {
      Memory.profileTicks = 0;
    }
  }

  tick() {
    if (Memory.profiling) {
      Memory.profileTicks++;
    }
  }

  track(name) {
    if (!Memory.profiling) {
      return this.noop;
    }

    const startCPU = Game.cpu.getUsed();
    return () => this.trackMethod(name, Game.cpu.getUsed() - startCPU);
  }

  wrap(name, func) {
    const done = this.track(name);
    const result = func();
    done();
    return result;
  }

  trackMethod(name, consumedCPU) {
    if (!Memory.profiling) {
      return;
    }

    statistics_1.stats.metric('Profile::' + name, consumedCPU);
  }

  start() {
    Memory.profiling = true;
  }

  stop() {
    Memory.profiling = false;
  }

  reset() {
    this.stop();
    Memory.profileTicks = 0;
    Memory.profileMethod = {};
  }

  memoryParse() {
    const stringified = JSON.stringify(Memory.pathStore);
    const startCpu = Game.cpu.getUsed();
    JSON.parse(stringified);
    const endCpu = Game.cpu.getUsed() - startCpu;
    const stringified2 = JSON.stringify(Memory.pathTreeStore);
    const startCpu2 = Game.cpu.getUsed();
    JSON.parse(stringified2);
    const endCpu2 = Game.cpu.getUsed() - startCpu2;
    console.log('CPU spent on Memory parsing:', endCpu, endCpu2);
  }

  visualizePath(from, to) {
    Object.keys(Memory.pathStore).slice(0, 1000).map(k => Memory.pathStore[k]).map(p => Room.deserializePath(p)).forEach(p => new RoomVisual('E64N49').poly(p, {
      stroke: '#fff',
      strokeWidth: .15,
      opacity: .2,
      lineStyle: 'dashed'
    }));
  }

}

exports.profiler = new Profiler();
global.Profiler = exports.profiler;

function Profile(name = '') {
  return function (target, key, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function () {
      const done = exports.profiler.track(name + '::' + key);
      const result = originalMethod.apply(this, arguments);
      done();
      return result;
    };

    return descriptor;
  };
}

exports.Profile = Profile;
},{"./statistics":"KIzw"}],"BHXf":[function(require,module,exports) {
"use strict";

var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

const profiler_1 = require("./telemetry/profiler");

function findStructures(room, types, where = FIND_MY_STRUCTURES) {
  return room.find(where, {
    filter: s => types.indexOf(s.structureType) > -1
  });
}

exports.findStructures = findStructures;

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

exports.getRandomInt = getRandomInt;

class Lazy {
  constructor(supplier) {
    this.supplier = supplier;
  }

  get() {
    if (!this.value) {
      this.value = this.supplier();
    }

    return this.value;
  }

  clear() {
    this.value = undefined;
  }

}

exports.Lazy = Lazy;

class Temporal {
  constructor(supplier) {
    this.supplier = supplier;
  }

  get() {
    if (!this.value || this.captureTime !== Game.time) {
      this.value = profiler_1.profiler.wrap('Temporal::supplier', this.supplier);
      this.captureTime = Game.time;
    }

    return this.value;
  }

  clear() {
    this.value = undefined;
  }

}

__decorate([profiler_1.Profile('Temporal')], Temporal.prototype, "get", null);

exports.Temporal = Temporal;

class TTL {
  constructor(ttl, supplier) {
    this.ttl = ttl;
    this.supplier = supplier;
    this.maxAge = Game.time - 1;
  }

  get() {
    if (this.emptyValue || this.old || this.arrayValueHasNullOrUndefinedItem) {
      try {
        this.value = this.supplier();
      } catch (e) {
        console.log('Caught in TTL', e);
      }

      this.maxAge = Game.time + this.ttl;
      TTL.miss++;
    } else {
      TTL.hit++;
    }

    return this.value;
  }

  get emptyValue() {
    return this.value === null || this.value === undefined;
  }

  get arrayValueHasNullOrUndefinedItem() {
    if (this.value instanceof Array) {
      return this.value.some(item => item === null || item === undefined);
    } else {
      return false;
    }
  }

  get old() {
    return Game.time > this.maxAge;
  }

  clear() {
    this.value = undefined;
  }

}

TTL.hit = 0;
TTL.miss = 0;
exports.TTL = TTL;

function forEachRoom(call) {
  for (let roomName in Game.rooms) {
    try {
      call(Game.rooms[roomName]);
    } catch (e) {
      console.log(e);
    }
  }
}

exports.forEachRoom = forEachRoom;
},{"./telemetry/profiler":"m431"}],"XRK8":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const hasMemoryRole = role => item => item.memory.role === role;

const notInMemoryRole = role => item => item.memory.role !== role;

class GameQueries {
  constructor() {
    this.creeps = () => (Object.keys(Game.creeps) || []).map(n => Game.creeps[n]);

    this.minerCreeps = () => this.creeps().filter(hasMemoryRole("miner"));

    this.carryCreeps = () => this.creeps().filter(hasMemoryRole("carry"));

    this.generalCreeps = () => this.creeps().filter(hasMemoryRole("general"));
  }

}

exports.GameQueries = GameQueries;

class RoomQueries {
  constructor(room) {
    this.room = room;

    this.sources = () => this.room.find(FIND_SOURCES);

    this.spawns = () => this.findMy(STRUCTURE_SPAWN);

    this.containers = () => this.find(FIND_STRUCTURES, [STRUCTURE_CONTAINER]);

    this.containerOrStorage = () => !!this.room.storage ? [...this.containers(), this.room.storage] : this.containers();

    this.extensions = () => this.findMy(STRUCTURE_EXTENSION);

    this.extensionOrSpawns = () => [...this.extensions(), ...this.spawns()];

    this.towers = () => this.findMy(STRUCTURE_TOWER);

    this.ramparts = () => this.findMy(STRUCTURE_RAMPART);

    this.walls = () => this.find(FIND_STRUCTURES, [STRUCTURE_WALL]);

    this.roads = () => this.find(FIND_STRUCTURES, [STRUCTURE_ROAD]);

    this.miningFlags = () => this.room.find(FIND_FLAGS, {
      filter: hasMemoryRole("mine")
    } || []);

    this.containerConstructions = () => this.find(FIND_MY_CONSTRUCTION_SITES, [STRUCTURE_CONTAINER]);

    this.hostileCreeps = () => this.room.find(FIND_HOSTILE_CREEPS);

    this.nonDefensiveStructures = () => this.room.find(FIND_STRUCTURES).filter(s => s.structureType !== STRUCTURE_WALL).filter(s => s.structureType !== STRUCTURE_RAMPART);

    this.creeps = () => (Object.keys(Game.creeps) || []).map(n => Game.creeps[n]).filter(c => c.room.name === this.room.name);

    this.minerCreeps = () => this.creeps().filter(hasMemoryRole("miner"));

    this.carryCreeps = () => this.creeps().filter(hasMemoryRole("carry"));

    this.generalCreeps = () => this.creeps().filter(hasMemoryRole("general"));

    this.fillableCreeps = () => this.creeps().filter(notInMemoryRole("miner")).filter(notInMemoryRole("carry"));

    this.find = (where, types) => this.room.find(where, {
      filter: s => types.includes(s.structureType)
    }) || [];

    this.findMy = type => this.find(FIND_MY_STRUCTURES, [type]);
  }

}

exports.RoomQueries = RoomQueries;
},{}],"LiCI":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const util_1 = require("../util");

const statistics_1 = require("../telemetry/statistics");

const query_1 = require("./query");

class MemoryStore {
  constructor(store) {
    this.store = store;

    if (!Memory[store]) {
      Memory[store] = {};
    }
  }

  has(key) {
    return !!Memory[this.store][key];
  }

  get(key) {
    return Memory[this.store][key];
  }

  set(key, value) {
    Memory[this.store][key] = value;
  }

  delete(key) {
    if (Memory[this.store]) {
      Memory[this.store][key] = undefined;
    }
  }

}

class BaseData {
  storeTo(key, cache, func) {
    if (!cache[key]) {
      cache[key] = func();
    } else {}

    return cache[key];
  }

  getDistanceKey(from, to) {
    return `${from.roomName}|${from.x}:${from.y}|${to.x}:${to.y}`;
  }

}

class Data extends BaseData {
  constructor() {
    super(...arguments);
    this.gameQueries = new query_1.GameQueries();
    this.creepsByJob = {};
    this.creeps = new util_1.Temporal(this.gameQueries.creeps);
    this.minerCreeps = new util_1.Temporal(this.gameQueries.minerCreeps);
    this.carryCreeps = new util_1.Temporal(this.gameQueries.carryCreeps);
    this.generalCreeps = new util_1.Temporal(this.gameQueries.generalCreeps);
    this.rooms = {};
  }

  creepsByJobTarget(job, jobTarget) {
    const getCreeps = () => this.creeps.get().filter(c => c.memory.job === job && c.memory.jobTarget === jobTarget);

    return this.storeTo(job + "|" + jobTarget, this.creepsByJob, () => new util_1.Temporal(getCreeps)).get();
  }

  registerCreepJob(creep) {
    this.creepsByJobTarget(creep.memory.job, creep.memory.jobTarget).push(creep);
  }

  of(room) {
    if (!this.rooms[room.name]) {
      this.rooms[room.name] = new RoomData(room);
    }

    return this.rooms[room.name];
  }

}

class RoomData {
  constructor(room) {
    this.room = room;
    this.queries = new query_1.RoomQueries(this.room);
    this.sources = new util_1.Temporal(this.queries.sources);
    this.spawns = new util_1.Temporal(this.queries.spawns);
    this.containers = new util_1.Temporal(this.queries.containers);
    this.storage = new util_1.Temporal(() => this.room.storage);
    this.containerOrStorage = new util_1.Temporal(this.queries.containerOrStorage);
    this.extensions = new util_1.Temporal(this.queries.extensions);
    this.extensionOrSpawns = new util_1.Temporal(this.queries.extensionOrSpawns);
    this.towers = new util_1.Temporal(this.queries.towers);
    this.ramparts = new util_1.Temporal(this.queries.ramparts);
    this.walls = new util_1.Temporal(this.queries.walls);
    this.roads = new util_1.Temporal(this.queries.roads);
    this.miningFlags = new util_1.Temporal(this.queries.miningFlags);
    this.containerConstructions = new util_1.Temporal(this.queries.containerConstructions);
    this.hostileCreeps = new util_1.Temporal(this.queries.hostileCreeps);
    this.nonDefensiveStructures = new util_1.Temporal(this.queries.nonDefensiveStructures);
    this.creeps = new util_1.Temporal(this.queries.creeps);
    this.minerCreeps = new util_1.Temporal(this.queries.minerCreeps);
    this.carryCreeps = new util_1.Temporal(this.queries.carryCreeps);
    this.generalCreeps = new util_1.Temporal(this.queries.generalCreeps);
    this.fillableCreeps = new util_1.Temporal(this.queries.fillableCreeps);
  }

}

exports.RoomData = RoomData;

class PathStore extends BaseData {
  constructor() {
    super(...arguments);
    this.store = new MemoryStore("pathStore");
  }

  getPath(room, from, to) {
    const key = this.getDistanceKey(from, to);

    if (!this.store.has(key)) {
      const path = room.findPath(from, to, {
        serialize: true,
        ignoreCreeps: true
      });
      this.store.set(key, path);
      statistics_1.stats.metric("PathStore::miss", 1);
    } else {
      statistics_1.stats.metric("PathStore::hit", 1);
    }

    return this.store.get(key);
  }

  renewPath(room, from, to) {
    statistics_1.stats.metric("PathStore::renew", 1);
    const key = this.getDistanceKey(from, to);
    this.store.delete(key);
    return this.getPath(room, from, to);
  }

}

exports.data = new Data();
exports.pathStore = new PathStore();
},{"../util":"BHXf","../telemetry/statistics":"KIzw","./query":"XRK8"}],"5vzf":[function(require,module,exports) {
"use strict";

var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

const data_1 = require("./data/data");

const profiler_1 = require("./telemetry/profiler");

const util_1 = require("./util");

const mapToCost = p => BODYPART_COST[p];

const sum = (a, b) => a + b;

class CreepType {
  constructor(name, body) {
    this.name = name;
    this.body = body;
    this.cost = this.body.map(mapToCost).reduce(sum, 0);
  }

}

exports.CreepType = CreepType;

class MinerCreep extends CreepType {
  constructor(lvl) {
    const body = [];

    for (let i = 0; i < lvl; i++) {
      body.push(WORK);
    }

    body.push(CARRY);
    body.push(MOVE);
    super('miner', body);
  }

}

class CarryCreep extends CreepType {
  constructor(lvl) {
    const body = [];

    for (let i = 0; i < lvl; i++) {
      body.push(CARRY);
      body.push(MOVE);
    }

    super('carry', body);
  }

}

class GeneralCreep extends CreepType {
  constructor(lvl) {
    const body = [];

    for (let i = 0; i < lvl; i++) {
      body.push(WORK);
      body.push(CARRY);
      body.push(MOVE);
    }

    super('general', body);
  }

}

class MinerCreepSpawner {}

class SpawnManager {
  constructor() {
    this.generalCreepCount = 1;
    this.carryCreepCount = 6;
    this.generalCreepTypes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((v, idx) => new GeneralCreep(15 - idx));
    this.minerCreepTypes = [1, 2, 3, 4, 5, 6].map((v, idx) => new MinerCreep(6 - idx));
    this.carryCreepTypes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((v, idx) => new CarryCreep(20 - idx));

    this.notSpawning = s => !s.spawning;
  }

  loop() {
    util_1.forEachRoom(room => {
      const roomData = data_1.data.of(room);
      const spawns = roomData.spawns.get();
      const availableSpawns = spawns.filter(this.notSpawning);

      if (availableSpawns.length === 0) {
        return;
      }

      const spawnables = [];
      roomData.minerCreeps.clear();
      const spawnMiner = roomData.minerCreeps.get().length < roomData.sources.get().length;

      if (spawnMiner) {
        console.log('Spawn: miner', roomData.minerCreeps.get().length, roomData.sources.get().length);
        spawnables.push(this.minerCreepTypes);
        roomData.minerCreeps.clear();
      }

      if (roomData.carryCreeps.get().length < this.carryCreepCount) {
        spawnables.push(this.carryCreepTypes);
        roomData.carryCreeps.clear();
      }

      if (roomData.generalCreeps.get().length < this.generalCreepCount) {
        spawnables.push(this.generalCreepTypes);
        roomData.generalCreeps.clear();
      }

      availableSpawns.forEach(spawn => {
        const types = spawnables.shift();

        if (types) {
          const creep = types.find(c => spawn.canCreateCreep(c.body) === OK);

          if (creep) {
            const newName = spawn.createCreep(creep.body, undefined, {
              role: creep.name
            });
            console.log('Spawning new ' + creep.name + ' ' + newName);
            this.showSpawningLabel(spawn);
            return;
          }
        }
      });
    });
  }

  showSpawningLabel(spawn) {
    if (spawn.spawning) {
      var spawningCreep = Game.creeps[spawn.spawning.name];
      spawn.room.visual.text('🛠️' + spawningCreep.memory.role, spawn.pos.x + 1, spawn.pos.y, {
        align: 'left',
        opacity: 0.8
      });
    }
  }

}

__decorate([profiler_1.Profile('Spawn')], SpawnManager.prototype, "loop", null);

exports.SpawnManager = SpawnManager;
exports.spawnManager = new SpawnManager();
},{"./data/data":"LiCI","./telemetry/profiler":"m431","./util":"BHXf"}],"yJHy":[function(require,module,exports) {
"use strict";

var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

const data_1 = require("./data/data");

const profiler_1 = require("./telemetry/profiler");

class RoomManager {
  constructor() {
    this.processMiningSpot = room => source => spot => {
      const flagName = "mine|" + spot.x + ":" + spot.y;
      room.createFlag(spot.x, spot.y, flagName, COLOR_BROWN, COLOR_BROWN);
      data_1.data.of(room).miningFlags.clear();
      Memory.flags[flagName] = {
        role: "mine",
        source: source.id
      };
    };

    this.notWallTerrain = t => t.terrain !== "wall";
  }

  initRooms() {
    if (!Memory.flags) {
      Memory.flags = {};
    }

    for (let name in Game.rooms) {
      const room = Game.rooms[name];

      if (!room.memory.miningFlags) {
        const processMiningSpotForRoom = this.processMiningSpot(room);
        data_1.data.of(room).sources.get().forEach(source => {
          const miningSpots = this.getAdjacentNonWallPositions(room, source.pos);
          const processMiningSpotOfSource = processMiningSpotForRoom(source);
          miningSpots.forEach(processMiningSpotOfSource);
        });
        room.memory.miningFlags = true;
      }
    }
  }

  getAdjacentNonWallPositions(room, pos) {
    const terrain = room.lookForAtArea(LOOK_TERRAIN, pos.y - 1, pos.x - 1, pos.y + 1, pos.x + 1, true);
    return terrain.filter(this.notWallTerrain);
  }

  getMiningFlags(room) {
    return data_1.data.of(room).miningFlags.get();
  }

}

__decorate([profiler_1.Profile("Room")], RoomManager.prototype, "initRooms", null);

exports.roomManager = new RoomManager();
},{"./data/data":"LiCI","./telemetry/profiler":"m431"}],"WjBd":[function(require,module,exports) {
"use strict";

var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

const data_1 = require("./data/data");

const profiler_1 = require("./telemetry/profiler");

class ConstructionManager {
  constructor() {
    this.memorySource = item => item.memory.source;

    this.memoryChosen = item => item.memory.chosen;
  }

  loop() {
    for (let roomName in Game.rooms) {
      const room = Game.rooms[roomName];
      this.buildMiningContainers(room);
    }
  }

  buildMiningContainers(room) {
    const roomData = data_1.data.of(room);
    const containers = roomData.containers.get();
    const containersUnderConstruction = roomData.containerConstructions.get();
    const currentContainers = containers.length + containersUnderConstruction.length;

    if (currentContainers === 5) {
      return;
    }

    const miningFlags = roomData.miningFlags.get();
    const maxContainers = Math.min(5, miningFlags.length, roomData.sources.get().length);

    if (currentContainers === maxContainers) {
      return;
    }

    const minerSources = roomData.minerCreeps.get().map(this.memorySource);
    const coveredSources = miningFlags.filter(this.memoryChosen).map(this.memorySource).concat(minerSources);
    const buildableFlags = miningFlags.filter(flag => !coveredSources.includes(flag.memory.source));
    const spawn = roomData.spawns.get()[0];
    const chosen = spawn.pos.findClosestByPath(FIND_FLAGS, {
      filter: f => buildableFlags.includes(f)
    });

    if (chosen) {
      chosen.memory.chosen = true;
      chosen.pos.createConstructionSite(STRUCTURE_CONTAINER);
      roomData.containerConstructions.clear();
    } else {
      console.log('WARN: no chosen buildable flag', coveredSources, buildableFlags, chosen);
    }
  }

}

__decorate([profiler_1.Profile('Construction')], ConstructionManager.prototype, "loop", null);

exports.constructionManager = new ConstructionManager();
},{"./data/data":"LiCI","./telemetry/profiler":"m431"}],"k11/":[function(require,module,exports) {
"use strict";

var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

const profiler_1 = require("./telemetry/profiler");

const data_1 = require("./data/data");

class TowerManager {
  constructor() {
    this.notMaxHP = c => c.hits < c.hitsMax;

    this.lowerThan500HP = r => r.hits < 500;
  }

  loop() {
    for (let name in Game.rooms) {
      const room = Game.rooms[name];
      const roomData = data_1.data.of(room);
      const towers = roomData.towers.get();
      if (!towers || !towers.length) continue;
      const hostileCreeps = data_1.data.of(room).hostileCreeps.get();

      if (hostileCreeps && hostileCreeps.length) {
        towers.forEach(t => t.attack(hostileCreeps[0]));
        return;
      }

      const decayingRampart = roomData.ramparts.get().find(this.lowerThan500HP);

      if (decayingRampart) {
        towers.forEach(t => t.repair(decayingRampart));
        return;
      }

      const damagedStructure = roomData.nonDefensiveStructures.get().find(this.notMaxHP);

      if (damagedStructure) {
        towers.forEach(t => t.repair(damagedStructure));
        return;
      }

      const damagedCreep = roomData.creeps.get().find(this.notMaxHP);

      if (!!damagedCreep) {
        towers.forEach(t => t.heal(damagedCreep));
        return;
      }
    }
  }

}

__decorate([profiler_1.Profile('Tower')], TowerManager.prototype, "loop", null);

exports.towerManager = new TowerManager();
},{"./telemetry/profiler":"m431","./data/data":"LiCI"}],"xncl":[function(require,module,exports) {
"use strict";

var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

const profiler_1 = require("./telemetry/profiler");

const statistics_1 = require("./telemetry/statistics");

class Messaging {
  constructor() {
    this.nodeId = this.generateId();
    if (!Memory.messages) Memory.messages = [];
  }

  get messages() {
    return Memory.messages;
  }

  generateId() {
    return [(Math.random() * 1000).toFixed(0), (Math.random() * 1000).toFixed(0), (Math.random() * 1000).toFixed(0)].join('-');
  }

  consumeMessages(type) {
    return this.messages.filter(m => m.source != this.nodeId).filter(m => !m.consumed.includes(this.nodeId)).map(m => {
      m.consumed.push(this.nodeId);
      return m;
    });
  }

  send(type, value) {
    statistics_1.stats.metric('Messaging:sent', 1);
    this.messages.push({
      type,
      value,
      maxAge: Game.time + 100,
      source: this.nodeId,
      consumed: []
    });
  }

  loop() {
    Memory.messages = this.messages.filter(m => m.consumed.length < 4).filter(m => m.maxAge < Game.time);
  }

}

__decorate([profiler_1.Profile('Messaging')], Messaging.prototype, "loop", null);

exports.Messaging = Messaging;
exports.messaging = new Messaging();
},{"./telemetry/profiler":"m431","./telemetry/statistics":"KIzw"}],"eM/m":[function(require,module,exports) {
"use strict";

var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

const statistics_1 = require("../telemetry/statistics");

const util_1 = require("../util");

const profiler_1 = require("../telemetry/profiler");

const messaging_1 = require("../messaging");

class CreepMovement {
  constructor() {
    this.pathsToTarget = {};
  }

  moveCreep(creep, target) {
    if (creep.fatigue > 0) return OK;
    const fromKey = '' + creep.pos;
    const toKey = '' + target;
    this.initTo(toKey);
    let moveResult = OK; // if (this.isStuck(creep)) {
    //   creep.move(this.getRandomDirection());
    //   this.setPrevPos(creep);
    //   stats.metric('Creep::Move::Stuck', 1);
    //   return OK;
    // }

    let path;

    if (false && this.hasPath(fromKey, toKey)) {
      //TODO: some bug
      path = this.getPath(fromKey, toKey);
      statistics_1.stats.metric('Creep::Move::Reusepath', 1);
    } else {
      path = profiler_1.profiler.wrap('Creep::Move::findPath', () => creep.room.findPath(creep.pos, target, {
        ignoreCreeps: true,
        serialize: true
      }));
      messaging_1.messaging.send('path', fromKey + '|' + toKey + '|' + path);
      this.storePath(fromKey, toKey, path);
      statistics_1.stats.metric('Creep::Move::FindPath', 1);
    } //moveResult = profiler.wrap('Creep::Move::moveByPath', () => creep.moveByPath(path));


    creep.moveTo(target);
    statistics_1.stats.metric('Creep::Move::' + moveResult, 1);

    if (moveResult !== OK) {
      console.log('Creep\tMove\t' + moveResult);

      if (moveResult === ERR_NOT_FOUND) {
        creep.move(this.getRandomDirection());
      }
    }

    this.setPrevPos(creep);
    return moveResult;
  }

  isStuck(creep) {
    if (!creep.memory.posSince) return false;

    if (Game.time - creep.memory.posSince > 3) {
      return true;
    }

    return false;
  }

  setPrevPos(creep) {
    const creepPos = '' + creep.pos;

    if (creep.memory.prevPos !== creepPos) {
      creep.memory.prevPos = creepPos;
      creep.memory.posSince = Game.time;
    }
  }

  initTo(toKey) {
    if (!this.pathsToTarget[toKey]) {
      this.pathsToTarget[toKey] = {};
    }
  }

  getRandomDirection() {
    return util_1.getRandomInt(1, 8);
  }

  getPath(fromKey, toKey) {
    return this.pathsToTarget[toKey][fromKey];
  }

  hasPath(fromKey, toKey) {
    return !!this.getPath(fromKey, toKey);
  }

  storePath(fromKey, toKey, path) {
    this.pathsToTarget[toKey][fromKey] = path;
  }

  loop() {
    messaging_1.messaging.consumeMessages('path').forEach(m => {
      console.log('consume message', m);
      const splitMessage = m.value.split('|');
      this.storePath(splitMessage[0], splitMessage[1], splitMessage[2]);
    });
  }

}

__decorate([profiler_1.Profile('Creep::Move')], CreepMovement.prototype, "loop", null);

exports.CreepMovement = CreepMovement;
exports.creepMovement = new CreepMovement();
},{"../telemetry/statistics":"KIzw","../util":"BHXf","../telemetry/profiler":"m431","../messaging":"xncl"}],"o7HM":[function(require,module,exports) {
"use strict";

var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

const data_1 = require("../data/data");

const profiler_1 = require("../telemetry/profiler");

const creep_movement_1 = require("./creep.movement");

class TargetSelectionPolicy {
  static random(targets) {
    return targets.sort(() => Math.floor(Math.random() * 3) - 1);
  }

  static inOrder(targets) {
    return targets;
  }

  static distance(targets, creep) {
    if (targets.length < 2) return targets;
    const distances = new WeakMap();
    targets.forEach(t => distances.set(t, profiler_1.profiler.wrap("Distances::getRangeTo", () => creep.pos.getRangeTo(t.pos))));
    return targets.sort((a, b) => distances.get(a) - distances.get(b));
  }

}

exports.TargetSelectionPolicy = TargetSelectionPolicy;

class CreepJob {
  constructor(name, color, say, action, jobDone, possibleTargets, targetSelectionPolicy, enoughCreepAssigned = () => false) {
    this.name = name;
    this.color = color;
    this.say = say;
    this.action = action;
    this.jobDone = jobDone;
    this.possibleTargets = possibleTargets;
    this.targetSelectionPolicy = targetSelectionPolicy;
    this.enoughCreepAssigned = enoughCreepAssigned;
  }

  execute(creep, targetId) {
    const target = Game.getObjectById(targetId);

    if (!target) {
      this.finishJob(creep, target);
      return;
    }

    if (this.jobDone(creep, target)) {
      this.finishJob(creep, target);
      return;
    }

    const result = profiler_1.profiler.wrap("Creep::action::" + this.name, () => this.action(creep, target));

    if (result == ERR_NOT_IN_RANGE) {
      this.moveCreep(creep, target);
    } else if (result !== OK) {
      this.finishJob(creep, target);
      return;
    }

    if (this.jobDone(creep, target)) {
      this.finishJob(creep, target);
    }
  }

  moveCreep(creep, target) {
    if (!target) return;
    let moveResult = profiler_1.profiler.wrap("Creep::Move", () => creep_movement_1.creepMovement.moveCreep(creep, target.pos));

    if (moveResult === ERR_NO_PATH) {
      this.finishJob(creep, target);
    }

    return moveResult;
  }

  finishJob(creep, target) {
    delete creep.memory.job;
    delete creep.memory.jobTarget;
    delete creep.memory.path;
  }

  needMoreCreeps(target) {
    const assignedCreeps = data_1.data.creepsByJobTarget(this.name, target.id);
    return !this.enoughCreepAssigned(assignedCreeps, target);
  }

}

exports.CreepJob = CreepJob;

class CreepManager {
  constructor() {
    this.jobs = [new CreepJob("idle", "#ffaa00", "idle", c => 0, c => (c.carry.energy || 0) > 0, c => [c], TargetSelectionPolicy.inOrder), new CreepJob("build", "#ffaa00", "🚧 build", (c, t) => c.build(t), c => c.carry.energy == 0, c => c.room.find(FIND_MY_CONSTRUCTION_SITES), TargetSelectionPolicy.distance), new CreepJob("smallWall", "#ffaa00", "wall", (c, t) => c.repair(t), (c, t) => c.carry.energy == 0 || t.hits >= 500, c => data_1.data.of(c.room).walls.get().filter(w => w.hits < 500), TargetSelectionPolicy.distance), new CreepJob("upgrade", "#ffaa00", "⚡ upgrade", (c, t) => c.upgradeController(t), c => c.carry.energy == 0, c => [c.room.controller], TargetSelectionPolicy.inOrder)];
    this.currentJobs = this.jobs;
    this.currentJobsByname = {};

    this.fillJobsByName = j => this.currentJobsByname[j.name] = j;

    this.executeJob = () => {
      const job = this.currentJobsByname[this.currentCreep.memory.job];
      job.execute(this.currentCreep, this.currentCreep.memory.jobTarget);
    };

    this.assignJob = () => this.currentJobs.some(this.findAndAssignJob);

    this.defined = t => !!t;

    this.findAndAssignJob = j => {
      this.currentJob = j;
      return j.targetSelectionPolicy(j.possibleTargets(this.currentCreep).filter(this.defined).filter(this.jobDoneOnTarget).filter(this.targetNeedsMoreCreep), this.currentCreep).some(this.setUnfinishedJobTargetToCreep);
    };

    this.jobDoneOnTarget = t => !this.currentJob.jobDone(this.currentCreep, t);

    this.targetNeedsMoreCreep = t => this.currentJob.needMoreCreeps(t);

    this.setUnfinishedJobTargetToCreep = target => {
      if (!this.currentJob.jobDone(this.currentCreep, target)) {
        this.currentCreep.memory.job = this.currentJob.name;
        this.currentCreep.memory.jobTarget = target.id;
        this.currentCreep.say(this.currentJob.say);
        data_1.data.registerCreepJob(this.currentCreep);
        return true;
      } else {
        return false;
      }
    };
  }

  loop() {
    data_1.data.generalCreeps.get().forEach(creep => this.processCreep(creep, this.jobs));
  }

  processCreep(creep, jobs) {
    this.currentCreep = creep;
    this.currentJobs = jobs;
    this.currentJobsByname = {};
    jobs.forEach(this.fillJobsByName); // TODO

    if (!creep.memory.job) {
      profiler_1.profiler.wrap("Creep::assignJob::" + creep.memory.role, this.assignJob);
    }

    if (creep.memory.job) {
      profiler_1.profiler.wrap("Creep::executeJob::" + creep.memory.role, this.executeJob);
    }
  }

}

__decorate([profiler_1.Profile("Creep")], CreepManager.prototype, "loop", null);

exports.CreepManager = CreepManager;
exports.creepManager = new CreepManager();
},{"../data/data":"LiCI","../telemetry/profiler":"m431","./creep.movement":"eM/m"}],"kl90":[function(require,module,exports) {
"use strict";

var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

const creep_1 = require("./creep");

const profiler_1 = require("../telemetry/profiler");

const data_1 = require("../data/data");

const moveToContainer = new creep_1.CreepJob("moveToContainer", "ffaa00", "toContainer", (c, t) => ERR_NOT_IN_RANGE, (c, t) => !!t && c.pos.isEqualTo(t.pos), c => {
  const container = Game.getObjectById(c.memory.container);
  return !!container ? [container] : [];
}, creep_1.TargetSelectionPolicy.inOrder);
const harvestForContainerBuild = new creep_1.CreepJob("harvestToBuild", "ffaa00", "harvest", (c, t) => c.harvest(t), (c, t) => {
  const container = Game.getObjectById(c.memory.container);
  const nonConstruction = !(container instanceof ConstructionSite);
  const needRepair = container.hits < container.hitsMax;
  const creepFull = c.carry.energy === c.carryCapacity;
  return nonConstruction && !needRepair || creepFull;
}, c => [Game.getObjectById(c.memory.source)], creep_1.TargetSelectionPolicy.inOrder);
const buildContainer = new creep_1.CreepJob("buildContainer", "ffaa00", "build", (c, t) => c.build(t), (c, t) => !(t instanceof ConstructionSite) || !c.carry.energy, c => [Game.getObjectById(c.memory.container)], creep_1.TargetSelectionPolicy.inOrder);
const repairContainer = new creep_1.CreepJob("repairContainer", "ffaa00", "repair", (c, t) => c.repair(t), (c, t) => t.hits === t.hitsMax, c => [Game.getObjectById(c.memory.container)], creep_1.TargetSelectionPolicy.inOrder);
const mine = new creep_1.CreepJob("mine", "#aaaaaa", "mine", (c, t) => {
  c.harvest(t);
  return c.transfer(Game.getObjectById(c.memory.container), RESOURCE_ENERGY);
}, (c, t) => {
  const container = Game.getObjectById(c.memory.container);
  const containerNeedsRepair = container.hits < container.hitsMax;
  const containerFull = container.store.energy === container.storeCapacity;
  return containerNeedsRepair || containerFull || t.energy === 0;
}, c => [Game.getObjectById(c.memory.source)], creep_1.TargetSelectionPolicy.inOrder);
const waiting = new creep_1.CreepJob("wait", "#aaaaaa", "wait", c => 0, (c, t) => t.energy > 0, c => [Game.getObjectById(c.memory.source)], creep_1.TargetSelectionPolicy.inOrder);

class MinerCreepManager {
  constructor() {
    this.minerJobs = [moveToContainer, harvestForContainerBuild, buildContainer, repairContainer, mine, waiting];
    this.occupiedContainers = [];

    this.notSpawning = c => !c.spawning;

    this.mapToContainer = c => c.memory.container;

    this.isNotOccupied = c => !this.occupiedContainers.includes(c.id);

    this.matchesActContainerPos = f => f.pos.isEqualTo(this.currentContainer.pos);
  }

  loop() {
    const minerCreeps = data_1.data.minerCreeps.get().filter(this.notSpawning);
    minerCreeps.forEach(miner => {
      if (!miner.memory.source || !Game.getObjectById(miner.memory.container)) {
        this.chooseMiningPosition(miner, minerCreeps);
      }

      creep_1.creepManager.processCreep(miner, this.minerJobs);
    });
  }

  chooseMiningPosition(creep, minerCreeps) {
    const roomData = data_1.data.of(creep.room);
    this.occupiedContainers = minerCreeps.map(this.mapToContainer);
    const containers = roomData.containers.get();
    const freeContainers = containers.filter(this.isNotOccupied);

    if (freeContainers.length) {
      this.currentContainer = freeContainers[0];
    } else {
      const containerConstructions = roomData.containerConstructions.get();
      const freeConstructions = containerConstructions.filter(this.isNotOccupied);
      this.currentContainer = freeConstructions[0];
    }

    if (this.currentContainer) {
      console.log(creep.name, this.currentContainer.id);
      const flag = roomData.miningFlags.get().filter(this.matchesActContainerPos)[0];
      creep.memory.container = this.currentContainer.id;
      creep.memory.source = flag.memory.source;
    } else {
      console.log("WARN: no container found for mining position");
    }
  }

}

__decorate([profiler_1.Profile("Miner")], MinerCreepManager.prototype, "loop", null);

exports.minerCreepManager = new MinerCreepManager();
},{"./creep":"o7HM","../telemetry/profiler":"m431","../data/data":"LiCI"}],"LqpF":[function(require,module,exports) {
"use strict";

var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

const creep_1 = require("./creep");

const data_1 = require("../data/data");

const profiler_1 = require("../telemetry/profiler");

const sumCreepEnergy = creeps => creeps.map(c => c.carry.energy || 0).reduce((a, b) => a + b, 0);

const energy = new creep_1.CreepJob('energy', '#ffaa00', 'energy', (c, t) => c.withdraw(t, RESOURCE_ENERGY), (c, t) => (c.carry.energy || 0) > 0 || t.store[RESOURCE_ENERGY] === 0, c => data_1.data.of(c.room).containerOrStorage.get().filter(s => (s.store[RESOURCE_ENERGY] || 0) > c.carryCapacity), creep_1.TargetSelectionPolicy.distance);
const fillSpawnOrExtension = new creep_1.CreepJob('fillSpawn', '#ffffff', 'fill:spawn', (c, t) => c.transfer(t, RESOURCE_ENERGY), (c, t) => c.carry.energy == 0 || t.energy == t.energyCapacity, c => data_1.data.of(c.room).extensionOrSpawns.get(), creep_1.TargetSelectionPolicy.distance, (ac, t) => t.energyCapacity - t.energy < sumCreepEnergy(ac));
const fillTower = new creep_1.CreepJob('fillTower', '#ffffff', 'fill:tower', (c, t) => c.transfer(t, RESOURCE_ENERGY), (c, t) => c.carry.energy === 0 || t.energy === t.energyCapacity, c => data_1.data.of(c.room).towers.get(), creep_1.TargetSelectionPolicy.distance, (ac, t) => t.energyCapacity - t.energy < sumCreepEnergy(ac));
const fillCreeps = new creep_1.CreepJob('fillCreep', '#ee00aa', 'fill:creep', (c, t) => c.transfer(t, RESOURCE_ENERGY), (c, t) => !!t && (c.carry.energy === 0 || (t.carry.energy || 0) === t.carryCapacity), c => data_1.data.of(c.room).fillableCreeps.get(), creep_1.TargetSelectionPolicy.distance, (ac, t) => t.carryCapacity - (t.carry.energy || 0) < sumCreepEnergy(ac));
const fillStorage = new creep_1.CreepJob('fillStorage', 'af1277', 'fill:storage', (c, t) => c.transfer(t, RESOURCE_ENERGY, (c.carry.energy || 0) - c.carryCapacity * 0.5), (c, t) => !!t && ((c.carry.energy || 0) <= c.carryCapacity * 0.5 || t.storeCapacity === t.store.energy), c => c.room.storage ? [c.room.storage] : [], creep_1.TargetSelectionPolicy.inOrder);
const idleFill = new creep_1.CreepJob('idlefill', '#ffaa00', 'idle', (c, t) => c.withdraw(t, RESOURCE_ENERGY), (c, t) => (c.carry.energy || 0) > c.carryCapacity * 0.5 || t.store[RESOURCE_ENERGY] === 0, c => data_1.data.of(c.room).containers.get().filter(s => s.store[RESOURCE_ENERGY] > 0), targets => targets.sort((a, b) => b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY]));

class CarryCreepManager {
  constructor() {
    this.carryJobs = [energy, fillSpawnOrExtension, fillTower, fillCreeps, fillStorage, idleFill];

    this.processCreep = c => creep_1.creepManager.processCreep(c, this.carryJobs);
  }

  loop() {
    data_1.data.carryCreeps.get().forEach(this.processCreep);
  }

}

__decorate([profiler_1.Profile('Carry')], CarryCreepManager.prototype, "loop", null);

exports.carryCreepManager = new CarryCreepManager();
},{"./creep":"o7HM","../data/data":"LiCI","../telemetry/profiler":"m431"}],"FSRJ":[function(require,module,exports) {
"use strict";

var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

const data_1 = require("../data/data");

const statistics_1 = require("./statistics");

const profiler_1 = require("./profiler");

const util_1 = require("../util");

class Efficiency {
  loop() {
    if (Game.cpu.bucket < 5000) return;
    util_1.forEachRoom(room => {
      this.containerUsage(room);
      this.carryCreepUtilization(room);
      this.sourceMining(room);
      this.energyAvailable(room);
    });
    profiler_1.profiler.wrap('Efficiency::EmptyFunction', () => 1);
  }

  containerUsage(room) {
    data_1.data.of(room).containers.get().map(container => (container.store.energy || 0) / container.storeCapacity).forEach(usage => statistics_1.stats.metric(`Efficiency::${room.name}::container`, usage));
  }

  carryCreepUtilization(room) {
    data_1.data.of(room).carryCreeps.get().map(carry => (carry.carry.energy || 0) / carry.carryCapacity).forEach(utilization => statistics_1.stats.metric(`Efficiency::${room.name}::carry`, utilization));
  }

  sourceMining(room) {
    data_1.data.of(room).sources.get().map(s => s.energy / s.energyCapacity).forEach(unMined => statistics_1.stats.metric(`Efficiency::${room.name}::source`, unMined));
  }

  energyAvailable(room) {
    statistics_1.stats.metric(`Efficiency::${room.name}::energy`, room.energyAvailable / room.energyCapacityAvailable);
  }

}

__decorate([profiler_1.Profile('Efficiency')], Efficiency.prototype, "loop", null);

exports.Efficiency = Efficiency;
exports.efficiency = new Efficiency();
},{"../data/data":"LiCI","./statistics":"KIzw","./profiler":"m431","../util":"BHXf"}],"ZCfc":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const spawn_1 = require("./spawn");

const profiler_1 = require("./telemetry/profiler");

const room_1 = require("./room");

const construction_1 = require("./construction");

const tower_1 = require("./tower");

const creep_miner_1 = require("./creep/creep.miner");

const creep_carry_1 = require("./creep/creep.carry");

const creep_1 = require("./creep/creep");

const messaging_1 = require("./messaging");

const creep_movement_1 = require("./creep/creep.movement");

const efficiency_1 = require("./telemetry/efficiency");

const statistics_1 = require("./telemetry/statistics");

exports.loop = function () {
  profiler_1.profiler.trackMethod('Game::Start', Game.cpu.getUsed());
  profiler_1.profiler.tick();
  const done = profiler_1.profiler.track('Game loop');

  for (var name in Memory.creeps) {
    if (!Game.creeps[name]) {
      delete Memory.creeps[name];
      console.log('Clearing non-existing creep memory:', name);
    }
  }

  room_1.roomManager.initRooms();
  construction_1.constructionManager.loop();
  spawn_1.spawnManager.loop();
  tower_1.towerManager.loop();
  creep_miner_1.minerCreepManager.loop();
  creep_carry_1.carryCreepManager.loop();
  creep_1.creepManager.loop();
  messaging_1.messaging.loop();
  creep_movement_1.creepMovement.loop();
  efficiency_1.efficiency.loop();
  statistics_1.stats.loop();
  done();
};
},{"./spawn":"5vzf","./telemetry/profiler":"m431","./room":"yJHy","./construction":"WjBd","./tower":"k11/","./creep/creep.miner":"kl90","./creep/creep.carry":"LqpF","./creep/creep":"o7HM","./messaging":"xncl","./creep/creep.movement":"eM/m","./telemetry/efficiency":"FSRJ","./telemetry/statistics":"KIzw"}]},{},["ZCfc"], null)
