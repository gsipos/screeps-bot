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

    this.sum = (a, b) => a + b;

    this.calculateMetric = metric => {
      metric.avg = metric.sum / metric.count;
      metric.last50Avg = metric.last50.reduce(this.sum, 0) / metric.last50.length;
    };

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
    this.metricsToCalculate.forEach(this.calculateMetric);
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
},{}],"BHXf":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

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

class Interval {
  constructor(ticks, callBack, lowCPU = false) {
    this.ticks = ticks;
    this.callBack = callBack;
    this.lowCPU = lowCPU;
    this.nextCall = Game.time;
    this.nextCall = Game.time + ticks;
  }

  run() {
    if (!this.lowCPU && exports.lowCPU()) return;

    if (Game.time > this.nextCall) {
      this.callBack();
      this.nextCall = Game.time + this.ticks;
    }
  }

}

exports.Interval = Interval;

exports.lowCPU = () => Game.cpu.bucket < 5000;

class RoomProvider {
  constructor(supplier) {
    this.supplier = supplier;
    this.stuff = {};
  }

  of(room) {
    if (!this.stuff[room.name]) {
      this.stuff[room.name] = this.supplier(room);
    }

    return this.stuff[room.name];
  }

}

exports.RoomProvider = RoomProvider;

exports.sumReducer = (a, b) => a + b;

exports.averageOf = items => items.reduce(exports.sumReducer, 0) / items.length;

exports.boolToScore = b => b ? 1 : 0;

exports.fails = b => !b;

exports.succeeds = b => b;

exports.role = obj => obj.Memory.role;

exports.toArray = obj => (Object.keys(obj) || []).map(key => obj[key]);

exports.notNullOrUndefined = a => a !== null && a !== undefined;

exports.toName = a => a.name;

exports.myRoom = r => !!r.controller && r.controller.my;
},{}],"VhlO":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var CreepRole;

(function (CreepRole) {
  CreepRole["GENERAL"] = "general";
  CreepRole["CARRY"] = "carry";
  CreepRole["MINER"] = "miner";
  CreepRole["REMOTEMINER"] = "remoteHarvester";
  CreepRole["HARASSER"] = "harasser";
})(CreepRole = exports.CreepRole || (exports.CreepRole = {}));
},{}],"ug9a":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

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

exports.MemoryStore = MemoryStore;
},{}],"m431":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const statistics_1 = require("./statistics");

class Profiler {
  constructor() {
    this.noopTrackId = 0;
    this.lastTrackId = 1;
    this.trackStartCPUs = {};
    this.trackMethods = {};

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

  getNewTrackId() {
    return this.lastTrackId++;
  }

  track(name) {
    if (!Memory.profiling) {
      return this.noopTrackId;
    }

    const id = this.getNewTrackId();
    this.trackStartCPUs[id] = Game.cpu.getUsed();
    this.trackMethods[id] = name;
    return id;
  }

  finish(id) {
    if (!id) return;
    const name = this.trackMethods[id];
    const start = this.trackStartCPUs[id];
    this.trackMethod(name, Game.cpu.getUsed() - start);
    delete this.trackStartCPUs[id];
    delete this.trackMethods[id];
  }

  wrap(name, func) {
    const trackId = this.track(name);
    const result = func();
    this.finish(trackId);
    return result;
  }

  trackMethod(name, consumedCPU) {
    if (!Memory.profiling) return;
    statistics_1.stats.metric("Profile::" + name, consumedCPU);
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
    console.log("CPU spent on Memory parsing:", endCpu, endCpu2);
  }

  visualizePath(from, to) {
    Object.keys(Memory.pathStore).slice(0, 1000).map(k => Memory.pathStore[k]).map(p => Room.deserializePath(p)).forEach(p => new RoomVisual("E64N49").poly(p, {
      stroke: "#fff",
      strokeWidth: 0.15,
      opacity: 0.2,
      lineStyle: "dashed"
    }));
  }

}

exports.profiler = new Profiler();
global.Profiler = exports.profiler;

function Profile(name = "") {
  return function (target, key, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function () {
      const trackId = exports.profiler.track(name + "::" + key);
      const result = originalMethod.apply(this, arguments);
      exports.profiler.finish(trackId);
      return result;
    };

    return descriptor;
  };
}

exports.Profile = Profile;
},{"./statistics":"KIzw"}],"gAKg":[function(require,module,exports) {
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

const memory_store_1 = require("../data/memory/memory-store");

const util_1 = require("../util");

const profiler_1 = require("../telemetry/profiler");

const CHARTINFO_VALIDITY = 5000;

class Geographer {
  constructor() {
    this.chartedRooms = new memory_store_1.MemoryStore("geographerChartedRooms");

    this.processRoom = room => {
      if (this.isUncharted(room.name)) {
        console.log('Gathering info about uncharted room:', room.name);
        this.chartRoom(room);
      }
    };
  }

  loop() {
    try {
      data_1.data.rooms.get().forEach(this.processRoom);
    } catch (error) {
      console.log("Geographer error:", error);
    }
  }

  chartRoom(room) {
    const roomData = data_1.data.of(room);
    const hasHostileCreeps = !!roomData.hostileCreeps.get().length;
    const hasHostileStructures = !!roomData.hostileStructures.get().length;
    const hasHostileTowers = !!roomData.hostileTowers.get().length;
    const info = {
      name: room.name,
      enemyActivity: hasHostileCreeps || hasHostileStructures || hasHostileTowers,
      enemyTowers: hasHostileTowers,
      my: !!room.controller && room.controller.my,
      sources: roomData.sources.get().length,
      time: Game.time
    };
    this.chartedRooms.set(room.name, info);
  }

  isUncharted(room) {
    const info = this.chartedRooms.get(room);

    if (!info) {
      return true;
    }

    if (Game.time - info.time > CHARTINFO_VALIDITY) {
      this.chartedRooms.delete(room);
      return true;
    }

    return false;
  }

  describeNeighbours(room) {
    const exits = Game.map.describeExits(room.name);
    const infos = [];

    if (!exits) {
      return [];
    }

    const top = exits[TOP];

    if (top) {
      infos.push(this.toNeighborInfo(top, TOP));
    }

    const right = exits[RIGHT];

    if (right) {
      infos.push(this.toNeighborInfo(right, RIGHT));
    }

    const bottom = exits[BOTTOM];

    if (bottom) {
      infos.push(this.toNeighborInfo(bottom, BOTTOM));
    }

    const left = exits[LEFT];

    if (left) {
      infos.push(this.toNeighborInfo(left, LEFT));
    }

    return infos.filter(util_1.notNullOrUndefined);
  }

  toNeighborInfo(name, exit) {
    if (this.isUncharted(name)) {
      return {
        type: "UNCHARTED",
        exit,
        name,
        pos: new RoomPosition(25, 25, name)
      };
    } else {
      const info = this.chartedRooms.get(name);
      return {
        type: "CHARTED",
        exit,
        name,
        info,
        pos: new RoomPosition(25, 25, name)
      };
    }
  }

}

__decorate([profiler_1.Profile('Geographer')], Geographer.prototype, "loop", null);

exports.Geographer = Geographer;
exports.geographer = new Geographer();
},{"../data/data":"LiCI","../data/memory/memory-store":"ug9a","../util":"BHXf","../telemetry/profiler":"m431"}],"XRK8":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const util_1 = require("../util");

const roles_1 = require("../creep/roles");

const geographer_1 = require("../room/geographer");

const hasMemoryRole = role => item => item.memory.role === role;

const find = (room, where, types) => room.find(where, {
  filter: s => types.includes(s.structureType)
}) || [];

const findMy = (room, type) => find(room, FIND_MY_STRUCTURES, [type]);

class GameQueries {
  constructor() {
    this.rooms = () => util_1.toArray(Game.rooms);

    this.creeps = () => (Object.keys(Game.creeps) || []).map(n => Game.creeps[n]);

    this.minerCreeps = () => this.creeps().filter(hasMemoryRole(roles_1.CreepRole.MINER));

    this.carryCreeps = () => this.creeps().filter(hasMemoryRole(roles_1.CreepRole.CARRY));

    this.generalCreeps = () => this.creeps().filter(hasMemoryRole(roles_1.CreepRole.GENERAL));

    this.harasserCreeps = () => this.creeps().filter(hasMemoryRole(roles_1.CreepRole.HARASSER));

    this.remoteMinerCreeps = () => this.creeps().filter(hasMemoryRole(roles_1.CreepRole.REMOTEMINER));
  }

}

exports.GameQueries = GameQueries;

class RoomQueries {
  constructor(room) {
    this.room = room;

    this.sources = () => this.room.find(FIND_SOURCES);

    this.spawns = () => findMy(this.room, STRUCTURE_SPAWN);

    this.constructions = () => this.room.find(FIND_MY_CONSTRUCTION_SITES);

    this.containers = () => find(this.room, FIND_STRUCTURES, [STRUCTURE_CONTAINER]);

    this.containerOrStorage = () => !!this.room.storage ? [...this.containers(), this.room.storage] : this.containers();

    this.extensions = () => findMy(this.room, STRUCTURE_EXTENSION);

    this.extensionOrSpawns = () => [...this.extensions(), ...this.spawns()];

    this.towers = () => findMy(this.room, STRUCTURE_TOWER);

    this.ramparts = () => findMy(this.room, STRUCTURE_RAMPART);

    this.walls = () => find(this.room, FIND_STRUCTURES, [STRUCTURE_WALL]);

    this.roads = () => find(this.room, FIND_STRUCTURES, [STRUCTURE_ROAD]);

    this.miningFlags = () => this.room.find(FIND_FLAGS, {
      filter: hasMemoryRole("mine")
    } || []);

    this.containerConstructions = () => find(this.room, FIND_MY_CONSTRUCTION_SITES, [STRUCTURE_CONTAINER]);

    this.hostileCreeps = () => this.room.find(FIND_HOSTILE_CREEPS);

    this.hostileStructures = () => this.room.find(FIND_HOSTILE_STRUCTURES);

    this.hostileTowers = () => find(this.room, FIND_HOSTILE_STRUCTURES, [STRUCTURE_TOWER]);

    this.nonDefensiveStructures = () => this.room.find(FIND_STRUCTURES).filter(s => s.structureType !== STRUCTURE_WALL).filter(s => s.structureType !== STRUCTURE_RAMPART);

    this.globalCreeps = () => (Object.keys(Game.creeps) || []).map(n => Game.creeps[n]);

    this.creeps = () => this.globalCreeps().filter(c => c.room.name === this.room.name);

    this.minerCreeps = () => this.creeps().filter(hasMemoryRole(roles_1.CreepRole.MINER));

    this.carryCreeps = () => this.creeps().filter(hasMemoryRole(roles_1.CreepRole.CARRY));

    this.generalCreeps = () => this.creeps().filter(hasMemoryRole(roles_1.CreepRole.GENERAL));

    this.fillableCreeps = () => this.creeps().filter(hasMemoryRole(roles_1.CreepRole.GENERAL));

    this.remoteMinerCreeps = () => this.globalCreeps().filter(hasMemoryRole(roles_1.CreepRole.REMOTEMINER)).filter(c => c.memory.home = this.room.name);

    this.neighbourRooms = () => geographer_1.geographer.describeNeighbours(this.room);
  }

}

exports.RoomQueries = RoomQueries;
},{"../util":"BHXf","../creep/roles":"VhlO","../room/geographer":"gAKg"}],"zLvG":[function(require,module,exports) {
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

const profiler_1 = require("../../telemetry/profiler");

class Temporal {
  constructor(supplier) {
    this.supplier = supplier;
  }

  get() {
    if (!this.value || this.captureTime !== Game.time) {
      this.value = profiler_1.profiler.wrap("Temporal::supplier", this.supplier);
      this.captureTime = Game.time;
    }

    return this.value;
  }

  clear() {
    this.value = undefined;
  }

  set(value) {
    this.value = value;
    this.captureTime = Game.time;
  }

}

__decorate([profiler_1.Profile("Temporal")], Temporal.prototype, "get", null);

exports.Temporal = Temporal;

function temporalize(dataSupplier) {
  return Object.keys(dataSupplier).reduce((supplier, key) => {
    supplier[key] = new Temporal(dataSupplier[key]);
    return supplier;
  }, {});
}

exports.temporalize = temporalize;
},{"../../telemetry/profiler":"m431"}],"LiCI":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const statistics_1 = require("../telemetry/statistics");

const query_1 = require("./query");

const temporal_1 = require("./cache/temporal");

const util_1 = require("../util");

const memory_store_1 = require("./memory/memory-store");

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
    this.rooms = new temporal_1.Temporal(this.gameQueries.rooms);
    this.creeps = new temporal_1.Temporal(this.gameQueries.creeps);
    this.minerCreeps = new temporal_1.Temporal(this.gameQueries.minerCreeps);
    this.carryCreeps = new temporal_1.Temporal(this.gameQueries.carryCreeps);
    this.generalCreeps = new temporal_1.Temporal(this.gameQueries.generalCreeps);
    this.harasserCreeps = new temporal_1.Temporal(this.gameQueries.harasserCreeps);
    this.remoteMinerCreeps = new temporal_1.Temporal(this.gameQueries.remoteMinerCreeps);
    this.roomDataProvider = new util_1.RoomProvider(r => temporal_1.temporalize(new query_1.RoomQueries(r)));
  }

  creepsByJobTarget(job, jobTarget) {
    const getCreeps = () => this.creeps.get().filter(c => c.memory.job === job && c.memory.jobTarget === jobTarget);

    return this.storeTo(job + "|" + jobTarget, this.creepsByJob, () => new temporal_1.Temporal(getCreeps)).get();
  }

  registerCreepJob(creep) {
    this.creepsByJobTarget(creep.memory.job, creep.memory.jobTarget).push(creep);
  }

  of(room) {
    return this.roomDataProvider.of(room);
  }

}

class PathStore extends BaseData {
  constructor() {
    super(...arguments);
    this.store = new memory_store_1.MemoryStore("pathStore");
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
},{"../telemetry/statistics":"KIzw","./query":"XRK8","./cache/temporal":"zLvG","../util":"BHXf","./memory/memory-store":"ug9a"}],"QSuD":[function(require,module,exports) {
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

const profiler_1 = require("../../telemetry/profiler");

const util_1 = require("../../util");

class RollingAverageComputed {
  constructor(dataSupplier, rollingAverageWindow) {
    this.dataSupplier = dataSupplier;
    this.rollingAverageWindow = rollingAverageWindow;
    this.items = [];
    this.avg = 0;
  }

  addToWindow(newValue) {
    this.items.push(newValue);

    while (this.items.length > this.rollingAverageWindow) {
      this.items.shift();
    }

    this.avg = this.items.reduce(util_1.sumReducer, 0) / this.items.length;
  }

  capture() {
    if (!this.value || this.captureTime !== Game.time) {
      this.value = profiler_1.profiler.wrap("RollingAverageComputed::supplier", this.dataSupplier);
      this.captureTime = Game.time;
      this.addToWindow(this.value);
    }
  }

  get() {
    this.capture();
    return this.value;
  }

  average() {
    this.capture();
    return this.avg;
  }

}

__decorate([profiler_1.Profile("RollingAverage")], RollingAverageComputed.prototype, "get", null);

__decorate([profiler_1.Profile("RollingAverage")], RollingAverageComputed.prototype, "average", null);

exports.RollingAverageComputed = RollingAverageComputed;
},{"../../telemetry/profiler":"m431","../../util":"BHXf"}],"FSRJ":[function(require,module,exports) {
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

const rolling_avg_computed_1 = require("../data/cache/rolling-avg-computed");

const roles_1 = require("../creep/roles");

class RoomEfficiency {
  constructor(room) {
    this.room = room;

    this.containerToUsage = container => (container.store.energy || 0) / container.storeCapacity;

    this.carryUsage = carry => (carry.carry.energy || 0) / carry.carryCapacity;

    this.toEnergyCapacityRatio = s => s.energy / s.energyCapacity;

    this.containerUsage = new rolling_avg_computed_1.RollingAverageComputed(() => util_1.averageOf(data_1.data.of(this.room).containers.get().map(this.containerToUsage)), 100);
    this.carryUtilization = new rolling_avg_computed_1.RollingAverageComputed(() => util_1.averageOf(data_1.data.of(this.room).carryCreeps.get().map(this.carryUsage)), 100);
    this.sourceMining = new rolling_avg_computed_1.RollingAverageComputed(() => util_1.averageOf(data_1.data.of(this.room).sources.get().map(this.toEnergyCapacityRatio)), 100);
    this.towerEnergy = new rolling_avg_computed_1.RollingAverageComputed(() => util_1.averageOf(data_1.data.of(this.room).towers.get().map(this.toEnergyCapacityRatio)), 100);
    this.spawnEnergy = new rolling_avg_computed_1.RollingAverageComputed(() => util_1.averageOf(data_1.data.of(this.room).extensionOrSpawns.get().map(this.toEnergyCapacityRatio)), 100);
    this.storageEnergy = new rolling_avg_computed_1.RollingAverageComputed(() => !!this.room.storage ? (this.room.storage.store.energy || 0) / this.room.storage.storeCapacity : 0, 100);
  }

}

exports.RoomEfficiency = RoomEfficiency;

class Efficiency {
  constructor() {
    this.roomEfficiencyProvider = new util_1.RoomProvider(r => new RoomEfficiency(r));

    this.effTestNoop = () => 1;

    this.report = (v, stat, room) => statistics_1.stats.metric(`Efficiency::${room.name}::${stat}`, v);
  }

  loop() {
    if (Game.cpu.bucket < 5000) return;
    data_1.data.rooms.get().filter(room => util_1.myRoom(room)).forEach(room => {
      const efficiency = this.roomEfficiencyProvider.of(room);
      this.report(efficiency.containerUsage.get(), "container", room);
      this.report(efficiency.carryUtilization.get(), roles_1.CreepRole.CARRY, room);
      this.report(efficiency.sourceMining.get(), "source", room);
      this.report(efficiency.spawnEnergy.get(), "spawn", room);
      this.energyAvailable(room);
    });
    profiler_1.profiler.wrap("Efficiency::EmptyFunction", this.effTestNoop);
  }

  of(room) {
    return this.roomEfficiencyProvider.of(room);
  }

  energyAvailable(room) {
    this.report(room.energyAvailable / room.energyCapacityAvailable, "energy", room);
  }

}

__decorate([profiler_1.Profile("Efficiency")], Efficiency.prototype, "loop", null);

exports.Efficiency = Efficiency;
exports.efficiency = new Efficiency();
},{"../data/data":"LiCI","./statistics":"KIzw","./profiler":"m431","../util":"BHXf","../data/cache/rolling-avg-computed":"QSuD","../creep/roles":"VhlO"}],"x/JR":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var BehaviorTreeStatus;

(function (BehaviorTreeStatus) {
  BehaviorTreeStatus["success"] = "SUCCESS";
  BehaviorTreeStatus["running"] = "RUNNING";
  BehaviorTreeStatus["failed"] = "FAILED";
})(BehaviorTreeStatus = exports.BehaviorTreeStatus || (exports.BehaviorTreeStatus = {}));

function treeSuccess(status) {
  return status === exports.SUCCESS;
}

exports.treeSuccess = treeSuccess;
exports.FAILED = BehaviorTreeStatus.failed;
exports.SUCCESS = BehaviorTreeStatus.success;
},{}],"MR9u":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const behavior_tree_status_1 = require("../behavior-tree-status");

class ActionNode {
  constructor(name, action) {
    this.name = name;
    this.action = action;
  }

  tick(state) {
    const result = this.action(state);

    if (!result) {
      throw new Error("No return value in action node " + this.name);
    }

    return result;
  }

}

exports.ActionNode = ActionNode;

class InverterNode {
  constructor(name) {
    this.name = name;
  }

  tick(state) {
    if (!this.child) {
      throw new Error("No inverter child " + this.name);
    }

    const result = this.child.tick(state);

    if (result === behavior_tree_status_1.BehaviorTreeStatus.failed) {
      return behavior_tree_status_1.BehaviorTreeStatus.success;
    } else if (result === behavior_tree_status_1.BehaviorTreeStatus.success) {
      return behavior_tree_status_1.BehaviorTreeStatus.failed;
    }

    return result;
  }

  addChild(child) {
    this.child = child;
  }

}

exports.InverterNode = InverterNode;

class SequenceNode {
  constructor(name) {
    this.name = name;
    this.children = [];
  }

  tick(state) {
    let lastStatus = behavior_tree_status_1.BehaviorTreeStatus.failed;
    const allSucceded = this.children.every(child => {
      lastStatus = child.tick(state);
      return lastStatus === behavior_tree_status_1.BehaviorTreeStatus.success;
    });

    if (allSucceded) {
      return behavior_tree_status_1.BehaviorTreeStatus.success;
    } else {
      return lastStatus;
    }
  }

  addChild(child) {
    this.children.push(child);
  }

}

exports.SequenceNode = SequenceNode;

class SelectorNode {
  constructor(name) {
    this.name = name;
    this.children = [];
  }

  tick(state) {
    let lastStatus = behavior_tree_status_1.FAILED;
    const someSucceed = this.children.some(child => {
      lastStatus = child.tick(state);
      return lastStatus === behavior_tree_status_1.BehaviorTreeStatus.success;
    });
    return someSucceed ? behavior_tree_status_1.SUCCESS : behavior_tree_status_1.FAILED;
  }

  addChild(child) {
    this.children.push(child);
  }

}

exports.SelectorNode = SelectorNode;

class ParalellNode {
  constructor(name, requiredToFail = 0, requiredToSucceed = 0) {
    this.name = name;
    this.requiredToFail = requiredToFail;
    this.requiredToSucceed = requiredToSucceed;
    this.children = [];
  }

  tick(state) {
    const statuses = this.children.map(c => c.tick(state));
    const succeeded = statuses.filter(s => s === behavior_tree_status_1.SUCCESS).length;
    const failed = statuses.filter(s => s === behavior_tree_status_1.FAILED).length;

    if (this.requiredToSucceed > 0 && succeeded >= this.requiredToSucceed) {
      return behavior_tree_status_1.BehaviorTreeStatus.success;
    }

    if (this.requiredToFail > 0 && failed >= this.requiredToFail) {
      return behavior_tree_status_1.BehaviorTreeStatus.failed;
    }

    return behavior_tree_status_1.BehaviorTreeStatus.running;
  }

  addChild(child) {
    this.children.push(child);
  }

}

exports.ParalellNode = ParalellNode;
},{"../behavior-tree-status":"x/JR"}],"wE6Y":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const behavior_tree_status_1 = require("./behavior-tree-status");

const node_1 = require("./node/node");

function selector(name, children) {
  const node = new node_1.SelectorNode(name);
  children.forEach(c => node.addChild(c));
  return node;
}

exports.selector = selector;

function inverter(name, child) {
  const node = new node_1.InverterNode(name);
  node.addChild(child);
  return node;
}

exports.inverter = inverter;

function sequence(name, children) {
  const node = new node_1.SequenceNode(name);
  children.forEach(c => node.addChild(c));
  return node;
}

exports.sequence = sequence;

function parallel(name, requiredTofail, requiredToSucceed, children) {
  const node = new node_1.ParalellNode(name, requiredTofail, requiredToSucceed);
  children.forEach(c => node.addChild(c));
  return node;
}

exports.parallel = parallel;
;

function action(name, action) {
  return new node_1.ActionNode(name, action);
}

exports.action = action;

function condition(name, predicate) {
  return new node_1.ActionNode(name, s => predicate(s) ? behavior_tree_status_1.BehaviorTreeStatus.success : behavior_tree_status_1.BehaviorTreeStatus.failed);
}

exports.condition = condition;

function mapState(name, map, child) {
  return {
    tick: state => child.tick(map(state))
  };
}

exports.mapState = mapState;
},{"./behavior-tree-status":"x/JR","./node/node":"MR9u"}],"On/S":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const util_1 = require("../util");

const efficiency_1 = require("../telemetry/efficiency");

const data_1 = require("../data/data");

const temporal_1 = require("../data/cache/temporal");

const behavior_tree_builder_1 = require("./behavior-tree/behavior-tree-builder");

const behavior_tree_status_1 = require("./behavior-tree/behavior-tree-status");

const telemetry = r => efficiency_1.efficiency.of(r);

exports.needMoreCarryCreepTree = behavior_tree_builder_1.selector("spawn carry", [behavior_tree_builder_1.sequence("definitely when", [behavior_tree_builder_1.condition("carries < 2", s => data_1.data.of(s).carryCreeps.get().length < 2)]), behavior_tree_builder_1.sequence("or", [behavior_tree_builder_1.sequence("when possible", [behavior_tree_builder_1.condition("less than max", r => data_1.data.of(r).carryCreeps.get().length < 7), behavior_tree_builder_1.condition("carry 20%+", r => telemetry(r).carryUtilization.average() > 0.2), behavior_tree_builder_1.condition("spawn energy 75%+", r => telemetry(r).spawnEnergy.get() > 0.75)]), behavior_tree_builder_1.parallel("and needed", 4, 2, [behavior_tree_builder_1.condition("carry 70%+", r => telemetry(r).carryUtilization.average() > 0.75), behavior_tree_builder_1.condition("containers 40%+", r => telemetry(r).containerUsage.average() > 0.4), behavior_tree_builder_1.condition("containers 90%+", r => telemetry(r).containerUsage.average() > 0.9), behavior_tree_builder_1.condition("spawn 75%-", r => telemetry(r).spawnEnergy.average() < 0.75), behavior_tree_builder_1.condition("tower 75%-", r => telemetry(r).towerEnergy.average() < 0.75)])])]);
exports.needMoreCarryCreep = new util_1.RoomProvider(room => new temporal_1.Temporal(() => behavior_tree_status_1.treeSuccess(exports.needMoreCarryCreepTree.tick(room))));
},{"../util":"BHXf","../telemetry/efficiency":"FSRJ","../data/data":"LiCI","../data/cache/temporal":"zLvG","./behavior-tree/behavior-tree-builder":"wE6Y","./behavior-tree/behavior-tree-status":"x/JR"}],"jBn9":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const util_1 = require("../util");

const efficiency_1 = require("../telemetry/efficiency");

const data_1 = require("../data/data");

const temporal_1 = require("../data/cache/temporal");

const behavior_tree_builder_1 = require("./behavior-tree/behavior-tree-builder");

exports.needMoreHarasserCreepTree = behavior_tree_builder_1.sequence("Need More harasser creep", [behavior_tree_builder_1.condition("less than 5", () => data_1.data.harasserCreeps.get().length < 5), behavior_tree_builder_1.condition("spawn 75%+", r => efficiency_1.efficiency.of(r).spawnEnergy.get() > 0.75), behavior_tree_builder_1.condition("spawn 75%+", r => efficiency_1.efficiency.of(r).storageEnergy.get() > 0.1), behavior_tree_builder_1.parallel("and if", 2, 2, [behavior_tree_builder_1.condition("hostiles present", r => data_1.data.of(r).hostileCreeps.get().length > 0), behavior_tree_builder_1.condition("spawn 75%+", r => efficiency_1.efficiency.of(r).spawnEnergy.average() > 0.75), behavior_tree_builder_1.condition("towers 75%+", r => efficiency_1.efficiency.of(r).towerEnergy.average() > 0.75)])]);
exports.needMoreHarasserCreep = new util_1.RoomProvider(room => new temporal_1.Temporal(() => exports.needMoreHarasserCreepTree.tick(room)));
},{"../util":"BHXf","../telemetry/efficiency":"FSRJ","../data/data":"LiCI","../data/cache/temporal":"zLvG","./behavior-tree/behavior-tree-builder":"wE6Y"}],"HdgM":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const util_1 = require("../util");

const efficiency_1 = require("../telemetry/efficiency");

const data_1 = require("../data/data");

const temporal_1 = require("../data/cache/temporal");

const behavior_tree_builder_1 = require("./behavior-tree/behavior-tree-builder");

exports.needRemoteMinerCreep = behavior_tree_builder_1.condition("Need Remote Miner Creep", room => {
  const telemetry = efficiency_1.efficiency.roomEfficiencyProvider.of(room);
  const hardLimits = [telemetry.spawnEnergy.get() > 0.75, telemetry.spawnEnergy.average() > 0.75, !!room.controller && room.controller.level > 3, data_1.data.of(room).remoteMinerCreeps.get().length < 3];
  return hardLimits.every(util_1.succeeds);
});
exports.needMoreRemoteMinerCreep = new util_1.RoomProvider(room => new temporal_1.Temporal(() => exports.needRemoteMinerCreep.tick(room)));
},{"../util":"BHXf","../telemetry/efficiency":"FSRJ","../data/data":"LiCI","../data/cache/temporal":"zLvG","./behavior-tree/behavior-tree-builder":"wE6Y"}],"jrAn":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const roles_1 = require("../roles");

const util_1 = require("../../util");

const mapToCost = p => BODYPART_COST[p];

class CreepType {
  constructor(name, body) {
    this.name = name;
    this.body = body;
    this.cost = this.body.map(mapToCost).reduce(util_1.sumReducer, 0);
  }

}

exports.CreepType = CreepType;

class MinerCreep extends CreepType {
  constructor(lvl) {
    const body = [];

    for (let i = 0; i <= lvl; i++) {
      body.push(WORK);
    }

    body.push(CARRY);
    body.push(MOVE);
    super(roles_1.CreepRole.MINER, body);
  }

}

exports.MinerCreep = MinerCreep;

class CarryCreep extends CreepType {
  constructor(lvl) {
    const body = [];

    for (let i = 0; i <= lvl; i++) {
      body.push(CARRY);
      body.push(MOVE);
    }

    super(roles_1.CreepRole.CARRY, body);
  }

}

exports.CarryCreep = CarryCreep;

class GeneralCreep extends CreepType {
  constructor(lvl) {
    const body = [];

    for (let i = 0; i <= lvl; i++) {
      body.push(WORK);
      body.push(CARRY);
      body.push(MOVE);
    }

    super(roles_1.CreepRole.GENERAL, body);
  }

}

exports.GeneralCreep = GeneralCreep;

class HarasserCreep extends CreepType {
  constructor(lvl) {
    const body = [];

    for (let i = 0; i <= lvl; i++) {
      body.push(ATTACK, MOVE);
    }

    super(roles_1.CreepRole.HARASSER, body);
  }

}

exports.HarasserCreep = HarasserCreep;

class RemoteMiner extends CreepType {
  constructor(lvl) {
    const body = [];

    for (let i = 0; i < lvl; i++) {
      body.push(i % 2 ? CARRY : WORK, MOVE);
      body.push(CARRY, MOVE);
    }

    super(roles_1.CreepRole.REMOTEMINER, body);
  }

}

exports.RemoteMiner = RemoteMiner;
},{"../roles":"VhlO","../../util":"BHXf"}],"5vzf":[function(require,module,exports) {
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

const spawn_carry_creep_1 = require("./decisions/spawn-carry-creep");

const spawn_harasser_creep_1 = require("./decisions/spawn-harasser-creep");

const spawn_remote_miner_creep_1 = require("./decisions/spawn-remote-miner-creep");

const creep_body_1 = require("./creep/body/creep.body");

const behavior_tree_builder_1 = require("./decisions/behavior-tree/behavior-tree-builder");

const behavior_tree_status_1 = require("./decisions/behavior-tree/behavior-tree-status");

class SpawnManager {
  constructor() {
    this.removeSpawnFromAvailables = behavior_tree_builder_1.action("remove spawn from availables", s => {
      const [x, ...remaining] = s.spawns;
      s.spawns = remaining;
      return !s.spawns.length ? behavior_tree_status_1.SUCCESS : behavior_tree_status_1.FAILED;
    });
    this.spawnTree = behavior_tree_builder_1.selector("Look for spawnable creeps", [behavior_tree_builder_1.condition("No idle spawn", s => s.spawns.length === 0), behavior_tree_builder_1.sequence("Spawn miner", [behavior_tree_builder_1.condition("less miner than source", s => data_1.data.of(s.room).minerCreeps.get().length < data_1.data.of(s.room).sources.get().length), behavior_tree_builder_1.action("spawn miner", s => this.spawnType(s.spawns[0], this.minerCreepTypes)), this.removeSpawnFromAvailables]), behavior_tree_builder_1.sequence("Spawn general", [behavior_tree_builder_1.condition("no general", s => data_1.data.of(s.room).generalCreeps.get().length === 0), behavior_tree_builder_1.action("spawn general", s => this.spawnType(s.spawns[0], this.generalCreepTypes)), this.removeSpawnFromAvailables]), behavior_tree_builder_1.sequence("Spawn carry", [behavior_tree_builder_1.mapState("", s => s.room, spawn_carry_creep_1.needMoreCarryCreepTree), behavior_tree_builder_1.action("spawn carry", s => this.spawnType(s.spawns[0], this.carryCreepTypes)), this.removeSpawnFromAvailables]), behavior_tree_builder_1.sequence("Spawn harasser", [behavior_tree_builder_1.mapState("", s => s.room, spawn_harasser_creep_1.needMoreHarasserCreepTree), behavior_tree_builder_1.action("spawn harasser", s => this.spawnType(s.spawns[0], this.harrasserCreepTypes)), this.removeSpawnFromAvailables]), behavior_tree_builder_1.sequence("Spawn remoteMiner", [behavior_tree_builder_1.mapState("", s => s.room, spawn_remote_miner_creep_1.needRemoteMinerCreep), behavior_tree_builder_1.action("spawn remoteMiner", s => this.spawnType(s.spawns[0], this.remoteMinerCreepTypes)), this.removeSpawnFromAvailables])]);
    this.generalCreepTypes = [...Array(6).keys()].reverse().map(lvl => new creep_body_1.GeneralCreep(lvl));
    this.minerCreepTypes = [...Array(6).keys()].reverse().map(lvl => new creep_body_1.MinerCreep(lvl));
    this.carryCreepTypes = [...Array(10).keys()].reverse().map(lvl => new creep_body_1.CarryCreep(lvl));
    this.harrasserCreepTypes = [...Array(14).keys()].reverse().map(lvl => new creep_body_1.HarasserCreep(lvl));
    this.remoteMinerCreepTypes = [...Array(5).keys()].reverse().map(lvl => new creep_body_1.RemoteMiner(lvl));

    this.notSpawning = s => !s.spawning;
  }

  loop() {
    util_1.forEachRoom(room => {
      const spawns = data_1.data.of(room).spawns.get().filter(this.notSpawning);
      this.spawnTree.tick({
        room,
        spawns
      });
    });
  }

  spawnType(spawn, types) {
    const creep = types.find(c => spawn.canCreateCreep(c.body) === OK);

    if (!creep) {
      return behavior_tree_status_1.FAILED;
    }

    const newName = spawn.createCreep(creep.body, undefined, {
      role: creep.name,
      home: spawn.room.name
    });

    if (typeof newName === "string") {
      console.log("Spawning new " + creep.name + " " + newName);
      this.showSpawningLabel(spawn);
      return behavior_tree_status_1.SUCCESS;
    } else {
      return behavior_tree_status_1.FAILED;
    }
  }

  showSpawningLabel(spawn) {
    if (spawn.spawning) {
      var spawningCreep = Game.creeps[spawn.spawning.name];
      spawn.room.visual.text("🛠️" + spawningCreep.memory.role, spawn.pos.x + 1, spawn.pos.y, {
        align: "left",
        opacity: 0.8
      });
    }
  }

}

__decorate([profiler_1.Profile("Spawn")], SpawnManager.prototype, "loop", null);

exports.SpawnManager = SpawnManager;
exports.spawnManager = new SpawnManager();
},{"./data/data":"LiCI","./telemetry/profiler":"m431","./util":"BHXf","./decisions/spawn-carry-creep":"On/S","./decisions/spawn-harasser-creep":"jBn9","./decisions/spawn-remote-miner-creep":"HdgM","./creep/body/creep.body":"jrAn","./decisions/behavior-tree/behavior-tree-builder":"wE6Y","./decisions/behavior-tree/behavior-tree-status":"x/JR"}],"yJHy":[function(require,module,exports) {
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

const util_1 = require("./util");

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
    if (!util_1.myRoom(room)) {
      return;
    }

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

    if (!spawn) {
      console.log('WARN: No spawn in room', room.name);
      return;
    }

    const chosen = spawn.pos.findClosestByPath(FIND_FLAGS, {
      filter: f => buildableFlags.includes(f)
    });

    if (chosen) {
      chosen.memory.chosen = true;
      chosen.pos.createConstructionSite(STRUCTURE_CONTAINER);
      roomData.containerConstructions.clear();
    } else {
      console.log("WARN: no chosen buildable flag", coveredSources, buildableFlags, chosen);
    }
  }

}

__decorate([profiler_1.Profile("Construction")], ConstructionManager.prototype, "loop", null);

exports.constructionManager = new ConstructionManager();
},{"./data/data":"LiCI","./telemetry/profiler":"m431","./util":"BHXf"}],"k11/":[function(require,module,exports) {
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
},{"./telemetry/profiler":"m431","./data/data":"LiCI"}],"Ph2c":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const profiler_1 = require("../../telemetry/profiler");

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
},{"../../telemetry/profiler":"m431"}],"YR8M":[function(require,module,exports) {
"use strict"; // source: https://github.com/bonzaiferroni/Traveler

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * To start using Traveler, require it in main.js:
 * Example: var Traveler = require('Traveler.js');
 */

class Traveler {
  /**
   * move creep to destination
   * @param creep
   * @param destination
   * @param options
   * @returns {number}
   */
  static travelTo(creep, destination, options = {}) {
    // uncomment if you would like to register hostile rooms entered
    // this.updateRoomStatus(creep.room);
    if (!destination) {
      return ERR_INVALID_ARGS;
    }

    if (creep.fatigue > 0) {
      Traveler.circle(creep.pos, "aqua", 0.3);
      return ERR_TIRED;
    }

    destination = this.normalizePos(destination); // manage case where creep is nearby destination

    let rangeToDestination = creep.pos.getRangeTo(destination);

    if (options.range && rangeToDestination <= options.range) {
      return OK;
    } else if (rangeToDestination <= 1) {
      if (rangeToDestination === 1 && !options.range) {
        let direction = creep.pos.getDirectionTo(destination);

        if (options.returnData) {
          options.returnData.nextPos = destination;
          options.returnData.path = direction.toString();
        }

        return creep.move(direction);
      }

      return OK;
    } // initialize data object


    if (!creep.memory._trav) {
      delete creep.memory._travel;
      creep.memory._trav = {};
    }

    let travelData = creep.memory._trav;
    let state = this.deserializeState(travelData, destination); // uncomment to visualize destination
    // this.circle(destination.pos, "orange");
    // check if creep is stuck

    if (this.isStuck(creep, state)) {
      state.stuckCount++;
      Traveler.circle(creep.pos, "magenta", state.stuckCount * 0.2);
    } else {
      state.stuckCount = 0;
    } // handle case where creep is stuck


    if (!options.stuckValue) {
      options.stuckValue = DEFAULT_STUCK_VALUE;
    }

    if (state.stuckCount >= options.stuckValue && Math.random() > 0.5) {
      options.ignoreCreeps = false;
      options.freshMatrix = true;
      delete travelData.path;
    } // TODO:handle case where creep moved by some other function, but destination is still the same
    // delete path cache if destination is different


    if (!this.samePos(state.destination, destination)) {
      if (options.movingTarget && state.destination.isNearTo(destination)) {
        travelData.path += state.destination.getDirectionTo(destination);
        state.destination = destination;
      } else {
        delete travelData.path;
      }
    }

    if (options.repath && Math.random() < options.repath) {
      // add some chance that you will find a new path randomly
      delete travelData.path;
    } // pathfinding


    let newPath = false;

    if (!travelData.path) {
      newPath = true;

      if (creep.spawning) {
        return ERR_BUSY;
      }

      state.destination = destination;
      let cpu = Game.cpu.getUsed();
      let ret = this.findTravelPath(creep.pos, destination, options);
      let cpuUsed = Game.cpu.getUsed() - cpu;
      state.cpu = Math.round(cpuUsed + state.cpu);

      if (state.cpu > REPORT_CPU_THRESHOLD) {
        // see note at end of file for more info on this
        console.log(`TRAVELER: heavy cpu use: ${creep.name}, cpu: ${state.cpu} origin: ${creep.pos}, dest: ${destination}`);
      }

      let color = "orange";

      if (ret.incomplete) {
        // uncommenting this is a great way to diagnose creep behavior issues
        // console.log(`TRAVELER: incomplete path for ${creep.name}`);
        color = "red";
      }

      if (options.returnData) {
        options.returnData.pathfinderReturn = ret;
      }

      travelData.path = Traveler.serializePath(creep.pos, ret.path, color);
      state.stuckCount = 0;
    }

    this.serializeState(creep, destination, state, travelData);

    if (!travelData.path || travelData.path.length === 0) {
      return ERR_NO_PATH;
    } // consume path


    if (state.stuckCount === 0 && !newPath) {
      travelData.path = travelData.path.substr(1);
    }

    let nextDirection = parseInt(travelData.path[0], 10);

    if (options.returnData) {
      if (nextDirection) {
        let nextPos = Traveler.positionAtDirection(creep.pos, nextDirection);

        if (nextPos) {
          options.returnData.nextPos = nextPos;
        }
      }

      options.returnData.state = state;
      options.returnData.path = travelData.path;
    }

    return creep.move(nextDirection);
  }
  /**
   * make position objects consistent so that either can be used as an argument
   * @param destination
   * @returns {any}
   */


  static normalizePos(destination) {
    if (!(destination instanceof RoomPosition)) {
      return destination.pos;
    }

    return destination;
  }
  /**
   * check if room should be avoided by findRoute algorithm
   * @param roomName
   * @returns {RoomMemory|number}
   */


  static checkAvoid(roomName) {
    return Memory.rooms && Memory.rooms[roomName] && Memory.rooms[roomName].avoid;
  }
  /**
   * check if a position is an exit
   * @param pos
   * @returns {boolean}
   */


  static isExit(pos) {
    return pos.x === 0 || pos.y === 0 || pos.x === 49 || pos.y === 49;
  }
  /**
   * check two coordinates match
   * @param pos1
   * @param pos2
   * @returns {boolean}
   */


  static sameCoord(pos1, pos2) {
    return pos1.x === pos2.x && pos1.y === pos2.y;
  }
  /**
   * check if two positions match
   * @param pos1
   * @param pos2
   * @returns {boolean}
   */


  static samePos(pos1, pos2) {
    return this.sameCoord(pos1, pos2) && pos1.roomName === pos2.roomName;
  }
  /**
   * draw a circle at position
   * @param pos
   * @param color
   * @param opacity
   */


  static circle(pos, color, opacity) {
    new RoomVisual(pos.roomName).circle(pos.x, pos.y, {
      radius: 0.45,
      fill: "transparent",
      stroke: color,
      strokeWidth: 0.15,
      opacity: opacity
    });
  }
  /**
   * update memory on whether a room should be avoided based on controller owner
   * @param room
   */


  static updateRoomStatus(room) {
    if (!room) {
      return;
    }

    if (room.controller) {
      if (room.controller.owner && !room.controller.my) {
        room.memory.avoid = 1;
      } else {
        delete room.memory.avoid;
      }
    }
  }
  /**
   * find a path from origin to destination
   * @param origin
   * @param destination
   * @param options
   * @returns {PathfinderReturn}
   */


  static findTravelPath(origin, destination, options = {}) {
    options = Object.assign({
      ignoreCreeps: true,
      maxOps: DEFAULT_MAXOPS,
      range: 1
    }, options);

    if (options.movingTarget) {
      options.range = 0;
    }

    origin = this.normalizePos(origin);
    destination = this.normalizePos(destination);
    let originRoomName = origin.roomName;
    let destRoomName = destination.roomName; // check to see whether findRoute should be used

    let roomDistance = Game.map.getRoomLinearDistance(origin.roomName, destination.roomName);
    let allowedRooms = options.route;

    if (!allowedRooms && (options.useFindRoute || options.useFindRoute === undefined && roomDistance > 2)) {
      let route = this.findRoute(origin.roomName, destination.roomName, options);

      if (route) {
        allowedRooms = route;
      }
    }

    let roomsSearched = 0;

    let callback = roomName => {
      if (allowedRooms) {
        if (!allowedRooms[roomName]) {
          return false;
        }
      } else if (!options.allowHostile && Traveler.checkAvoid(roomName) && roomName !== destRoomName && roomName !== originRoomName) {
        return false;
      }

      roomsSearched++;
      let matrix;
      let room = Game.rooms[roomName];

      if (room) {
        if (options.ignoreStructures) {
          matrix = new PathFinder.CostMatrix();

          if (!options.ignoreCreeps) {
            Traveler.addCreepsToMatrix(room, matrix);
          }
        } else if (options.ignoreCreeps || roomName !== originRoomName) {
          matrix = this.getStructureMatrix(room, options.freshMatrix);
        } else {
          matrix = this.getCreepMatrix(room);
        }

        if (options.obstacles) {
          matrix = matrix.clone();

          for (let obstacle of options.obstacles) {
            if (obstacle.pos.roomName !== roomName) {
              continue;
            }

            matrix.set(obstacle.pos.x, obstacle.pos.y, 0xff);
          }
        }
      }

      if (options.roomCallback) {
        if (!matrix) {
          matrix = new PathFinder.CostMatrix();
        }

        let outcome = options.roomCallback(roomName, matrix.clone());

        if (outcome !== undefined) {
          return outcome;
        }
      }

      return matrix;
    };

    let ret = PathFinder.search(origin, {
      pos: destination,
      range: options.range
    }, {
      maxOps: options.maxOps,
      maxRooms: options.maxRooms,
      plainCost: options.offRoad ? 1 : options.ignoreRoads ? 1 : 2,
      swampCost: options.offRoad ? 1 : options.ignoreRoads ? 5 : 10,
      roomCallback: callback
    });

    if (ret.incomplete && options.ensurePath) {
      if (options.useFindRoute === undefined) {
        // handle case where pathfinder failed at a short distance due to not using findRoute
        // can happen for situations where the creep would have to take an uncommonly indirect path
        // options.allowedRooms and options.routeCallback can also be used to handle this situation
        if (roomDistance <= 2) {
          console.log(`TRAVELER: path failed without findroute, trying with options.useFindRoute = true`);
          console.log(`from: ${origin}, destination: ${destination}`);
          options.useFindRoute = true;
          ret = this.findTravelPath(origin, destination, options);
          console.log(`TRAVELER: second attempt was ${ret.incomplete ? "not " : ""}successful`);
          return ret;
        } // TODO: handle case where a wall or some other obstacle is blocking the exit assumed by findRoute

      } else {}
    }

    return ret;
  }
  /**
   * find a viable sequence of rooms that can be used to narrow down pathfinder's search algorithm
   * @param origin
   * @param destination
   * @param options
   * @returns {{}}
   */


  static findRoute(origin, destination, options = {}) {
    let restrictDistance = options.restrictDistance || Game.map.getRoomLinearDistance(origin, destination) + 10;
    let allowedRooms = {
      [origin]: true,
      [destination]: true
    };
    let highwayBias = 1;

    if (options.preferHighway) {
      highwayBias = 2.5;

      if (options.highwayBias) {
        highwayBias = options.highwayBias;
      }
    }

    let ret = Game.map.findRoute(origin, destination, {
      routeCallback: roomName => {
        if (options.routeCallback) {
          let outcome = options.routeCallback(roomName);

          if (outcome !== undefined) {
            return outcome;
          }
        }

        let rangeToRoom = Game.map.getRoomLinearDistance(origin, roomName);

        if (rangeToRoom > restrictDistance) {
          // room is too far out of the way
          return Number.POSITIVE_INFINITY;
        }

        if (!options.allowHostile && Traveler.checkAvoid(roomName) && roomName !== destination && roomName !== origin) {
          // room is marked as "avoid" in room memory
          return Number.POSITIVE_INFINITY;
        }

        let parsed;

        if (options.preferHighway) {
          parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
          let isHighway = parsed[1] % 10 === 0 || parsed[2] % 10 === 0;

          if (isHighway) {
            return 1;
          }
        } // SK rooms are avoided when there is no vision in the room, harvested-from SK rooms are allowed


        if (!options.allowSK && !Game.rooms[roomName]) {
          if (!parsed) {
            parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(roomName);
          }

          let fMod = parsed[1] % 10;
          let sMod = parsed[2] % 10;
          let isSK = !(fMod === 5 && sMod === 5) && fMod >= 4 && fMod <= 6 && sMod >= 4 && sMod <= 6;

          if (isSK) {
            return 10 * highwayBias;
          }
        }

        return highwayBias;
      }
    });

    if (!Array.isArray(ret)) {
      console.log(`couldn't findRoute to ${destination}`);
      return;
    }

    for (let value of ret) {
      allowedRooms[value.room] = true;
    }

    return allowedRooms;
  }
  /**
   * check how many rooms were included in a route returned by findRoute
   * @param origin
   * @param destination
   * @returns {number}
   */


  static routeDistance(origin, destination) {
    let linearDistance = Game.map.getRoomLinearDistance(origin, destination);

    if (linearDistance >= 32) {
      return linearDistance;
    }

    let allowedRooms = this.findRoute(origin, destination);

    if (allowedRooms) {
      return Object.keys(allowedRooms).length;
    }
  }
  /**
   * build a cost matrix based on structures in the room. Will be cached for more than one tick. Requires vision.
   * @param room
   * @param freshMatrix
   * @returns {any}
   */


  static getStructureMatrix(room, freshMatrix) {
    if (!this.structureMatrixCache[room.name] || freshMatrix && Game.time !== this.structureMatrixTick) {
      this.structureMatrixTick = Game.time;
      let matrix = new PathFinder.CostMatrix();
      this.structureMatrixCache[room.name] = Traveler.addStructuresToMatrix(room, matrix, 1);
    }

    return this.structureMatrixCache[room.name];
  }
  /**
   * build a cost matrix based on creeps and structures in the room. Will be cached for one tick. Requires vision.
   * @param room
   * @returns {any}
   */


  static getCreepMatrix(room) {
    if (!this.creepMatrixCache[room.name] || Game.time !== this.creepMatrixTick) {
      this.creepMatrixTick = Game.time;
      this.creepMatrixCache[room.name] = Traveler.addCreepsToMatrix(room, this.getStructureMatrix(room, true).clone());
    }

    return this.creepMatrixCache[room.name];
  }
  /**
   * add structures to matrix so that impassible structures can be avoided and roads given a lower cost
   * @param room
   * @param matrix
   * @param roadCost
   * @returns {CostMatrix}
   */


  static addStructuresToMatrix(room, matrix, roadCost) {
    let impassibleStructures = [];

    for (let structure of room.find(FIND_STRUCTURES)) {
      if (structure instanceof StructureRampart) {
        if (!structure.my && !structure.isPublic) {
          impassibleStructures.push(structure);
        }
      } else if (structure instanceof StructureRoad) {
        matrix.set(structure.pos.x, structure.pos.y, roadCost);
      } else if (structure instanceof StructureContainer) {
        matrix.set(structure.pos.x, structure.pos.y, 5);
      } else {
        impassibleStructures.push(structure);
      }
    }

    for (let site of room.find(FIND_MY_CONSTRUCTION_SITES)) {
      if (site.structureType === STRUCTURE_CONTAINER || site.structureType === STRUCTURE_ROAD || site.structureType === STRUCTURE_RAMPART) {
        continue;
      }

      matrix.set(site.pos.x, site.pos.y, 0xff);
    }

    for (let structure of impassibleStructures) {
      matrix.set(structure.pos.x, structure.pos.y, 0xff);
    }

    return matrix;
  }
  /**
   * add creeps to matrix so that they will be avoided by other creeps
   * @param room
   * @param matrix
   * @returns {CostMatrix}
   */


  static addCreepsToMatrix(room, matrix) {
    room.find(FIND_CREEPS).forEach(creep => matrix.set(creep.pos.x, creep.pos.y, 0xff));
    return matrix;
  }
  /**
   * serialize a path, traveler style. Returns a string of directions.
   * @param startPos
   * @param path
   * @param color
   * @returns {string}
   */


  static serializePath(startPos, path, color = "orange") {
    let serializedPath = "";
    let lastPosition = startPos;
    this.circle(startPos, color);

    for (let position of path) {
      if (position.roomName === lastPosition.roomName) {
        new RoomVisual(position.roomName).line(position.x, position.y, lastPosition.x, lastPosition.y, {
          color: color,
          lineStyle: "dashed"
        });
        serializedPath += lastPosition.getDirectionTo(position);
      }

      lastPosition = position;
    }

    return serializedPath;
  }
  /**
   * returns a position at a direction relative to origin
   * @param origin
   * @param direction
   * @returns {RoomPosition}
   */


  static positionAtDirection(origin, direction) {
    let offsetX = [0, 0, 1, 1, 1, 0, -1, -1, -1];
    let offsetY = [0, -1, -1, 0, 1, 1, 1, 0, -1];
    let x = origin.x + offsetX[direction];
    let y = origin.y + offsetY[direction];

    if (x > 49 || x < 0 || y > 49 || y < 0) {
      return;
    }

    return new RoomPosition(x, y, origin.roomName);
  }
  /**
   * convert room avoidance memory from the old pattern to the one currently used
   * @param cleanup
   */


  static patchMemory(cleanup = false) {
    if (!Memory.empire) {
      return;
    }

    if (!Memory.empire.hostileRooms) {
      return;
    }

    let count = 0;

    for (let roomName in Memory.empire.hostileRooms) {
      if (Memory.empire.hostileRooms[roomName]) {
        if (!Memory.rooms[roomName]) {
          Memory.rooms[roomName] = {};
        }

        Memory.rooms[roomName].avoid = 1;
        count++;
      }

      if (cleanup) {
        delete Memory.empire.hostileRooms[roomName];
      }
    }

    if (cleanup) {
      delete Memory.empire.hostileRooms;
    }

    console.log(`TRAVELER: room avoidance data patched for ${count} rooms`);
  }

  static deserializeState(travelData, destination) {
    let state = {};

    if (travelData.state) {
      state.lastCoord = {
        x: travelData.state[STATE_PREV_X],
        y: travelData.state[STATE_PREV_Y]
      };
      state.cpu = travelData.state[STATE_CPU];
      state.stuckCount = travelData.state[STATE_STUCK];
      state.destination = new RoomPosition(travelData.state[STATE_DEST_X], travelData.state[STATE_DEST_Y], travelData.state[STATE_DEST_ROOMNAME]);
    } else {
      state.cpu = 0;
      state.destination = destination;
    }

    return state;
  }

  static serializeState(creep, destination, state, travelData) {
    travelData.state = [creep.pos.x, creep.pos.y, state.stuckCount, state.cpu, destination.x, destination.y, destination.roomName];
  }

  static isStuck(creep, state) {
    let stuck = false;

    if (state.lastCoord !== undefined) {
      if (this.sameCoord(creep.pos, state.lastCoord)) {
        // didn't move
        stuck = true;
      } else if (this.isExit(creep.pos) && this.isExit(state.lastCoord)) {
        // moved against exit
        stuck = true;
      }
    }

    return stuck;
  }

}

Traveler.structureMatrixCache = {};
Traveler.creepMatrixCache = {};
exports.Traveler = Traveler; // this might be higher than you wish, setting it lower is a great way to diagnose creep behavior issues. When creeps
// need to repath to often or they aren't finding valid paths, it can sometimes point to problems elsewhere in your code

const REPORT_CPU_THRESHOLD = 1000;
const DEFAULT_MAXOPS = 20000;
const DEFAULT_STUCK_VALUE = 2;
const STATE_PREV_X = 0;
const STATE_PREV_Y = 1;
const STATE_STUCK = 2;
const STATE_CPU = 3;
const STATE_DEST_X = 4;
const STATE_DEST_Y = 5;
const STATE_DEST_ROOMNAME = 6;
},{}],"fh7I":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const profiler_1 = require("../../telemetry/profiler");

const data_1 = require("../../data/data");

const util_1 = require("../../util");

const Traveler_1 = require("../../lib/Traveler");

class BaseCreepJob {
  finishJob(creep, target) {
    delete creep.memory.job;
    delete creep.memory.jobTarget;
    delete creep.memory.path;
  }

  moveCreep(creep, target) {
    if (!target) return;
    let moveResult = profiler_1.profiler.wrap("Traveler::travelTo", () => Traveler_1.Traveler.travelTo(creep, target, {
      allowHostile: true
    }));

    if (moveResult === ERR_NO_PATH) {
      this.finishJob(creep, target);
    }

    return moveResult;
  }

}

class CreepJob extends BaseCreepJob {
  constructor(name, color, say, action, jobDone, possibleTargets, targetSelectionPolicy, enoughCreepAssigned = () => false) {
    super();
    this.name = name;
    this.color = color;
    this.say = say;
    this.action = action;
    this.jobDone = jobDone;
    this.possibleTargets = possibleTargets;
    this.targetSelectionPolicy = targetSelectionPolicy;
    this.enoughCreepAssigned = enoughCreepAssigned;

    this.needMoreCreeps = target => {
      const assignedCreeps = data_1.data.creepsByJobTarget(this.name, target.id);
      return !this.enoughCreepAssigned(assignedCreeps, target);
    };
  }

  execute(creep, targetId) {
    const target = Game.getObjectById(targetId);

    if (!target) {
      // console.log(`Cannot find job ${this.name} target ${targetId}`);
      this.finishJob(creep, target);
      return;
    }

    if (this.jobDone(creep, target)) {
      // console.log(`Job ${this.name} done by ${creep.name} on ${creep.memory.job}`);
      this.finishJob(creep, target);
      return;
    }

    const result = profiler_1.profiler.wrap("Creep::action::" + this.name, () => this.action(creep, target));

    if (result == ERR_NOT_IN_RANGE) {
      // console.log(`Target for job ${this.name} is not in range`);
      this.moveCreep(creep, target.pos);
    } else if (result !== OK) {
      console.log(`Finishing job ${this.name} because unhandled error ${result}`);
      this.finishJob(creep, target);
      return;
    }

    if (this.jobDone(creep, target)) {
      this.finishJob(creep, target);
    }
  }

  findJobsFor(creep) {
    const jobs = this.possibleTargets(creep).filter(util_1.notNullOrUndefined).filter(t => !this.jobDone(creep, t)).filter(this.needMoreCreeps);
    return this.targetSelectionPolicy(jobs, creep);
  }

  assignJob(creep) {
    const jobs = this.findJobsFor(creep);

    if (jobs.length) {
      const target = jobs[0];
      creep.memory.job = this.name;
      creep.memory.jobTarget = target.id;
      creep.say(this.say); // console.log(`Asssign job ${this.name} to ${creep.memory.role} ${creep.name} `);

      data_1.data.registerCreepJob(creep);
      return true;
    } else {
      return false;
    }
  }

}

exports.CreepJob = CreepJob;

class MoveToRoomCreepJob extends BaseCreepJob {
  constructor(name, color, say, jobPredicate, jobDone, possibleTargets, targetSelectionPolicy) {
    super();
    this.name = name;
    this.color = color;
    this.say = say;
    this.jobPredicate = jobPredicate;
    this.jobDone = jobDone;
    this.possibleTargets = possibleTargets;
    this.targetSelectionPolicy = targetSelectionPolicy;

    this.targetToPos = target => new RoomPosition(25, 25, target);
  }

  execute(creep, room) {
    if (this.isInRoom(creep, room)) {
      this.finishJob(creep, room);
      return;
    }

    if (!this.onBorder(creep) && this.jobDone(creep, room)) {
      this.finishJob(creep, room);
      return;
    }

    if (this.moveCreep(creep, this.targetToPos(room)) !== OK) {
      this.finishJob(creep, room);
      return;
    }
  }

  isInRoom(creep, room) {
    return creep.room.name === room && !this.onBorder(creep);
  }

  onBorder(creep) {
    const onBorder = [creep.pos.x === 0, creep.pos.x === 49, creep.pos.y === 0, creep.pos.y === 49];
    return onBorder.some(util_1.succeeds);
  }

  assignJob(creep) {
    const rooms = this.targetSelectionPolicy(this.possibleTargets(creep), creep).filter(room => creep.room.name !== room).filter(room => this.jobPredicate(creep, room));

    if (rooms.length) {
      const room = rooms[0];
      creep.memory.job = this.name;
      creep.memory.jobTarget = room;
      creep.say(this.say);
      data_1.data.registerCreepJob(creep);
      return true;
    } else {
      console.log(`No ${this.name} for ${creep.memory.role} among ${this.possibleTargets(creep)} targets`);
      return false;
    }
  }

}

exports.MoveToRoomCreepJob = MoveToRoomCreepJob;
},{"../../telemetry/profiler":"m431","../../data/data":"LiCI","../../util":"BHXf","../../lib/Traveler":"YR8M"}],"o7HM":[function(require,module,exports) {
"use strict";

var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

function __export(m) {
  for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}

Object.defineProperty(exports, "__esModule", {
  value: true
});

const data_1 = require("../data/data");

const profiler_1 = require("../telemetry/profiler");

const target_selection_policy_1 = require("./job/target-selection-policy");

const creep_job_1 = require("./job/creep-job");

__export(require("./job/creep-job"));

class CreepManager {
  constructor() {
    this.jobs = [new creep_job_1.CreepJob("idle", "#ffaa00", "idle", c => 0, c => (c.carry.energy || 0) > 0, c => [c], target_selection_policy_1.TargetSelectionPolicy.inOrder), new creep_job_1.CreepJob("build", "#ffaa00", "🚧 build", (c, t) => c.build(t), c => c.carry.energy == 0, c => c.room.find(FIND_MY_CONSTRUCTION_SITES), target_selection_policy_1.TargetSelectionPolicy.distance), new creep_job_1.CreepJob("smallWall", "#ffaa00", "wall", (c, t) => c.repair(t), (c, t) => c.carry.energy == 0 || t.hits >= 500, c => data_1.data.of(c.room).walls.get().filter(w => w.hits < 500), target_selection_policy_1.TargetSelectionPolicy.distance), new creep_job_1.CreepJob("upgrade", "#ffaa00", "⚡ upgrade", (c, t) => c.upgradeController(t), c => c.carry.energy == 0, c => [c.room.controller], target_selection_policy_1.TargetSelectionPolicy.inOrder)];
    this.currentJobs = this.jobs;
    this.currentJobsByname = {};

    this.fillJobsByName = j => this.currentJobsByname[j.name] = j;

    this.executeJob = () => {
      const job = this.currentJobsByname[this.currentCreep.memory.job];
      job.execute(this.currentCreep, this.currentCreep.memory.jobTarget);
    };

    this.assignJob = () => this.currentJobs.some(this.findAndAssignJob);

    this.findAndAssignJob = job => job.assignJob(this.currentCreep);
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
},{"../data/data":"LiCI","../telemetry/profiler":"m431","./job/target-selection-policy":"Ph2c","./job/creep-job":"fh7I"}],"kl90":[function(require,module,exports) {
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

const target_selection_policy_1 = require("./job/target-selection-policy");

const moveToContainer = new creep_1.CreepJob("moveToContainer", "ffaa00", "toContainer", (c, t) => ERR_NOT_IN_RANGE, (c, t) => !!t && c.pos.isEqualTo(t.pos), c => {
  const container = Game.getObjectById(c.memory.container);
  return !!container ? [container] : [];
}, target_selection_policy_1.TargetSelectionPolicy.inOrder);
const harvestForContainerBuild = new creep_1.CreepJob("harvestToBuild", "ffaa00", "harvest", (c, t) => c.harvest(t), (c, t) => {
  const container = Game.getObjectById(c.memory.container);
  const nonConstruction = !(container instanceof ConstructionSite);
  const needRepair = container.hits < container.hitsMax;
  const creepFull = c.carry.energy === c.carryCapacity;
  return nonConstruction && !needRepair || creepFull;
}, c => [Game.getObjectById(c.memory.source)], target_selection_policy_1.TargetSelectionPolicy.inOrder);
const buildContainer = new creep_1.CreepJob("buildContainer", "ffaa00", "build", (c, t) => c.build(t), (c, t) => !(t instanceof ConstructionSite) || !c.carry.energy, c => [Game.getObjectById(c.memory.container)], target_selection_policy_1.TargetSelectionPolicy.inOrder);
const repairContainer = new creep_1.CreepJob("repairContainer", "ffaa00", "repair", (c, t) => c.repair(t), (c, t) => t.hits === t.hitsMax, c => [Game.getObjectById(c.memory.container)], target_selection_policy_1.TargetSelectionPolicy.inOrder);
const mine = new creep_1.CreepJob("mine", "#aaaaaa", "mine", (c, t) => {
  c.harvest(t);
  return c.transfer(Game.getObjectById(c.memory.container), RESOURCE_ENERGY);
}, (c, t) => {
  const container = Game.getObjectById(c.memory.container);
  const containerNeedsRepair = container.hits < container.hitsMax;
  const containerFull = container.store.energy === container.storeCapacity;
  return containerNeedsRepair || containerFull || t.energy === 0;
}, c => [Game.getObjectById(c.memory.source)], target_selection_policy_1.TargetSelectionPolicy.inOrder);
const waiting = new creep_1.CreepJob("wait", "#aaaaaa", "wait", c => 0, (c, t) => t.energy > 0, c => [Game.getObjectById(c.memory.source)], target_selection_policy_1.TargetSelectionPolicy.inOrder);

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
},{"./creep":"o7HM","../telemetry/profiler":"m431","../data/data":"LiCI","./job/target-selection-policy":"Ph2c"}],"LqpF":[function(require,module,exports) {
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

const target_selection_policy_1 = require("./job/target-selection-policy");

const util_1 = require("../util");

const sumCreepEnergy = creeps => creeps.map(c => c.carry.energy || 0).reduce(util_1.sumReducer, 0);

const energy = new creep_1.CreepJob('energy', '#ffaa00', 'energy', (c, t) => c.withdraw(t, RESOURCE_ENERGY), (c, t) => (c.carry.energy || 0) > 0 || t.store[RESOURCE_ENERGY] === 0, c => data_1.data.of(c.room).containerOrStorage.get().filter(s => util_1.notNullOrUndefined(s.store[RESOURCE_ENERGY])).filter(s => (s.store[RESOURCE_ENERGY] || 0) !== 0).filter(s => (s.store[RESOURCE_ENERGY] || 0) > c.carryCapacity), target_selection_policy_1.TargetSelectionPolicy.distance);
const fillSpawnOrExtension = new creep_1.CreepJob('fillSpawn', '#ffffff', 'fill:spawn', (c, t) => c.transfer(t, RESOURCE_ENERGY), (c, t) => c.carry.energy == 0 || t.energy == t.energyCapacity, c => data_1.data.of(c.room).extensionOrSpawns.get(), target_selection_policy_1.TargetSelectionPolicy.distance, (ac, t) => t.energyCapacity - t.energy < sumCreepEnergy(ac));
const fillTower = new creep_1.CreepJob('fillTower', '#ffffff', 'fill:tower', (c, t) => c.transfer(t, RESOURCE_ENERGY), (c, t) => c.carry.energy === 0 || t.energy === t.energyCapacity, c => data_1.data.of(c.room).towers.get(), target_selection_policy_1.TargetSelectionPolicy.distance, (ac, t) => t.energyCapacity - t.energy < sumCreepEnergy(ac));
const fillCreeps = new creep_1.CreepJob('fillCreep', '#ee00aa', 'fill:creep', (c, t) => c.transfer(t, RESOURCE_ENERGY), (c, t) => !!t && (c.carry.energy === 0 || (t.carry.energy || 0) > t.carryCapacity * 0.75), c => data_1.data.of(c.room).fillableCreeps.get(), target_selection_policy_1.TargetSelectionPolicy.distance, (ac, t) => t.carryCapacity - (t.carry.energy || 0) < sumCreepEnergy(ac));
const fillStorage = new creep_1.CreepJob('fillStorage', 'af1277', 'fill:storage', (c, t) => c.transfer(t, RESOURCE_ENERGY, (c.carry.energy || 0) - c.carryCapacity * 0.5), (c, t) => !!t && ((c.carry.energy || 0) <= c.carryCapacity * 0.5 || t.storeCapacity === t.store.energy), c => c.room.storage ? [c.room.storage] : [], target_selection_policy_1.TargetSelectionPolicy.inOrder);
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
},{"./creep":"o7HM","../data/data":"LiCI","../telemetry/profiler":"m431","./job/target-selection-policy":"Ph2c","../util":"BHXf"}],"xncl":[function(require,module,exports) {
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

    this.lessThan4Consumers = m => m.consumed.length < 4;

    this.tooOld = m => m.maxAge < Game.time;

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
    Memory.messages = this.messages.filter(this.lessThan4Consumers).filter(this.tooOld);
  }

}

__decorate([profiler_1.Profile('Messaging')], Messaging.prototype, "loop", null);

exports.Messaging = Messaging;
exports.messaging = new Messaging();
},{"./telemetry/profiler":"m431","./telemetry/statistics":"KIzw"}],"M39x":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const statistics_1 = require("./statistics");

const util_1 = require("../util");

class Reporter {
  constructor() {
    this.f2 = n => (n || 0).toFixed(2);

    this.pad = s => (s + "          ").substring(0, 10);

    this.separator = "\t\t| ";
    this.longSeparator = "----------------------------------------------";
    this.headerString = ["Sum", "Count", "Min", "Max", "Avg", "50Avg", "Name"].map(this.pad).join(this.separator);

    this.createMetricString = name => {
      const m = statistics_1.stats.stats[name];
      const metricString = [m.sum, m.count, m.min, m.max, m.avg, m.last50Avg].map(this.f2).map(this.pad).join(this.separator);
      return metricString + this.separator + name;
    };

    this.createStatReportLines = () => [this.longSeparator, this.headerString, ...Object.keys(statistics_1.stats.stats).sort((a, b) => a.localeCompare(b)).map(this.createMetricString), this.longSeparator];

    this.emailReport = () => {
      const lines = this.createStatReportLines();
      const chunks = [];
      let currentChunk = [];
      let currentChunkLength = 0;
      lines.forEach(line => {
        if (currentChunkLength + line.length > 900) {
          chunks.push(currentChunk);
          currentChunk = [line];
          currentChunkLength = line.length;
        } else {
          currentChunk.push(line);
          currentChunkLength += line.length;
        }
      });
      chunks.map(c => c.join("\n")).forEach(c => Game.notify(c, 180));
    };

    this.notifyScheduler = new util_1.Interval(22000, this.emailReport);
  }

  print() {
    this.createStatReportLines().map(s => console.log(s));
  }

  loop() {
    this.notifyScheduler.run();
  }

}

exports.reporter = new Reporter();
global.Reporter = exports.reporter;
},{"./statistics":"KIzw","../util":"BHXf"}],"cUlm":[function(require,module,exports) {
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

const creep_1 = require("./creep");

const profiler_1 = require("../telemetry/profiler");

const target_selection_policy_1 = require("./job/target-selection-policy");

const creep_job_1 = require("./job/creep-job");

const util_1 = require("../util");

const attack = (name, targets) => new creep_1.CreepJob(name, "#ffffff", "Attack", (c, t) => c.attack(t), (c, t) => !t, targets, target_selection_policy_1.TargetSelectionPolicy.distance);

exports.hostileCreepsInRoom = c => !!data_1.data.of(c.room).hostileCreeps.get().length;

const attackLocalEnemyCreeps = attack("attackLocalEnemyCreeps", c => data_1.data.of(c.room).hostileCreeps.get());
const attackLocalEnemyTowers = attack("attackLocalEnemyTowers", c => data_1.data.of(c.room).hostileTowers.get());
const attackLocalEnemyStructures = attack("attackLocalEnemyStructures", c => data_1.data.of(c.room).hostileStructures.get());
const exploreUnchartedTerritories = new creep_job_1.MoveToRoomCreepJob("exploreUnchartedTerritories", "#ffffff", "Explore", c => true, exports.hostileCreepsInRoom, c => data_1.data.of(c.room).neighbourRooms.get().filter(n => n.type === "UNCHARTED").map(util_1.toName), target_selection_policy_1.TargetSelectionPolicy.random);
const goToUndefendedKnownEnemy = new creep_job_1.MoveToRoomCreepJob("goToUndefendedKnownEnemy", "#ffffff", "-> Attack", c => true, exports.hostileCreepsInRoom, c => data_1.data.of(c.room).neighbourRooms.get().filter(n => n.type === "CHARTED" && n.info.enemyActivity && !n.info.enemyTowers).map(util_1.toName), target_selection_policy_1.TargetSelectionPolicy.random);
const goToDefendedKnownEnemy = new creep_job_1.MoveToRoomCreepJob("goToDefendedKnownEnemy", "#ffffff", "-> Attack", c => true, exports.hostileCreepsInRoom, c => data_1.data.of(c.room).neighbourRooms.get().filter(n => n.type === "CHARTED" && n.info.enemyActivity && n.info.enemyTowers).map(util_1.toName), target_selection_policy_1.TargetSelectionPolicy.inOrder);
const wanderAround = new creep_job_1.MoveToRoomCreepJob("wanderAround", "#ffffff", "wandering", c => true, exports.hostileCreepsInRoom, c => data_1.data.of(c.room).neighbourRooms.get().map(util_1.toName), target_selection_policy_1.TargetSelectionPolicy.random);

class HarasserCreepManager {
  constructor() {
    this.harasserJobs = [attackLocalEnemyCreeps, attackLocalEnemyTowers, attackLocalEnemyStructures, exploreUnchartedTerritories, goToUndefendedKnownEnemy, goToDefendedKnownEnemy, wanderAround];

    this.processCreep = c => creep_1.creepManager.processCreep(c, this.harasserJobs);
  }

  loop() {
    try {
      data_1.data.harasserCreeps.get().forEach(this.processCreep);
    } catch (error) {
      console.log("Error with harassercreep", error);
    }
  }

}

__decorate([profiler_1.Profile("Harasser")], HarasserCreepManager.prototype, "loop", null);

exports.harasserCreepManager = new HarasserCreepManager();
},{"../data/data":"LiCI","./creep":"o7HM","../telemetry/profiler":"m431","./job/target-selection-policy":"Ph2c","./job/creep-job":"fh7I","../util":"BHXf"}],"UET0":[function(require,module,exports) {
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

const creep_job_1 = require("./job/creep-job");

const target_selection_policy_1 = require("./job/target-selection-policy");

const util_1 = require("../util");

const profiler_1 = require("../telemetry/profiler");

const creep_harasser_1 = require("./creep.harasser"); // moveToAnother room
// find source
// harvest
// flee from enemy
// go back
// fill source


const hasEnergy = c => (c.carry.energy || 0) !== 0;

const fullOfEnergy = c => (c.carry.energy || 0) === (c.carryCapacity || 0);

const atHome = c => c.room.name === c.memory.home;

const inOwnedRoom = c => !!c.room.controller && c.room.controller.my;

const findRemoteSource = new creep_job_1.MoveToRoomCreepJob("findRemoteSource", "#ffffff", "remote", c => atHome(c), creep_harasser_1.hostileCreepsInRoom, c => data_1.data.of(c.room).neighbourRooms.get().filter(r => r.type === "CHARTED" && !r.info.enemyActivity && !!r.info.sources && !r.info.my).map(util_1.toName), target_selection_policy_1.TargetSelectionPolicy.random);
const harvest = new creep_job_1.CreepJob("remoteHarvest", "#ffffff", "Harvest", (c, t) => c.harvest(t), (c, t) => [atHome(c), fullOfEnergy(c), creep_harasser_1.hostileCreepsInRoom(c)].some(util_1.succeeds), c => data_1.data.of(c.room).sources.get(), target_selection_policy_1.TargetSelectionPolicy.distance);
const goHome = new creep_job_1.MoveToRoomCreepJob("moveHome", "#ffffff", "Home", c => !atHome(c), c => false, c => [c.memory.home], target_selection_policy_1.TargetSelectionPolicy.inOrder);
const fillStorage = new creep_job_1.CreepJob("fillStorage", "#ffffff", "Fill", (c, t) => c.transfer(t, RESOURCE_ENERGY, c.carryCapacity), c => !atHome(c) || !hasEnergy(c), c => [c.room.storage], target_selection_policy_1.TargetSelectionPolicy.inOrder);
const explore = new creep_job_1.MoveToRoomCreepJob("miner_explore", "#ffffff", "explore", c => atHome(c), creep_harasser_1.hostileCreepsInRoom, c => data_1.data.of(c.room).neighbourRooms.get().filter(room => room.type === "UNCHARTED").map(util_1.toName), target_selection_policy_1.TargetSelectionPolicy.inOrder);

class RemoteMinerCreepManager {
  constructor() {
    this.remoteMinerJobs = [fillStorage, harvest, findRemoteSource, explore, goHome];

    this.processCreep = c => creep_1.creepManager.processCreep(c, this.remoteMinerJobs);
  }

  loop() {
    try {
      data_1.data.remoteMinerCreeps.get().forEach(this.processCreep);
    } catch (error) {
      console.log("Error in RemoteMiners", error);
    }
  }

}

__decorate([profiler_1.Profile("RemoteMiner")], RemoteMinerCreepManager.prototype, "loop", null);

exports.remoteMinerCreepManager = new RemoteMinerCreepManager();
},{"./creep":"o7HM","../data/data":"LiCI","./job/creep-job":"fh7I","./job/target-selection-policy":"Ph2c","../util":"BHXf","../telemetry/profiler":"m431","./creep.harasser":"cUlm"}],"qN3n":[function(require,module,exports) {
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

const up = (p, d = 1) => new RoomPosition(p.x, p.y - d, p.roomName);

const down = (p, d = 1) => new RoomPosition(p.x, p.y + d, p.roomName);

const left = (p, d = 1) => new RoomPosition(p.x - d, p.y, p.roomName);

const right = (p, d = 1) => new RoomPosition(p.x + d, p.y, p.roomName);

class RoomPlanner {
  constructor() {
    this.positionFreeForBuild = pos => pos.look().every(look => look.type !== LOOK_STRUCTURES && look.type === "terrain" && look.terrain !== "wall");

    this.noAdjacentStructures = (p, room) => {
      const result = room.lookForAtArea(LOOK_STRUCTURES, p.y - 1, p.x - 1, p.y + 1, p.x + 1, true);
      return !result.length;
    };

    this.max = (name, lvl) => CONTROLLER_STRUCTURES[name][lvl];
  }

  loop() {
    try {
      data_1.data.rooms.get().forEach(room => this.build(room));
    } catch (error) {
      console.log("Roomplanner", error);
    }
  }

  build(room) {
    if (!room.controller || !room.controller.my) {
      return;
    }

    const lvl = room.controller.level;
    const spawn = data_1.data.of(room).spawns.get()[0];

    if (!spawn) {
      return;
    }

    this.buildStorage(room, lvl);
    this.buildTower(room, lvl);
  }

  buildStorage(room, lvl) {
    if (!this.max(STRUCTURE_STORAGE, lvl) || room.storage) {
      return;
    }

    const hasStrorageConstruction = data_1.data.of(room).constructions.get().filter(site => site.structureType === STRUCTURE_STORAGE).length;

    if (hasStrorageConstruction) {
      return;
    }

    const spawn = data_1.data.of(room).spawns.get()[0];
    this.buildAroundPos(STRUCTURE_STORAGE, spawn.pos, room);
  }

  buildTower(room, lvl) {
    const towerCount = data_1.data.of(room).towers.get().length + data_1.data.of(room).constructions.get().filter(site => site.structureType === STRUCTURE_TOWER).length;

    if (towerCount >= this.max(STRUCTURE_TOWER, lvl)) {
      return;
    }

    const spawn = data_1.data.of(room).spawns.get()[0];
    this.buildAroundPos(STRUCTURE_TOWER, spawn.pos, room);
  }

  buildAroundPos(type, pos, room) {
    [up(pos, 2), left(pos, 2), down(pos, 2), right(pos, 2), up(left(pos, 2), 2), down(left(pos, 2), 2), down(right(pos, 2), 2), up(right(pos, 2), 2)].some(candidate => {
      const free = this.positionFreeForBuild(candidate) && this.noAdjacentStructures(candidate, room);

      if (free) {
        candidate.createConstructionSite(type);
      }

      return free;
    });
  }

}

__decorate([profiler_1.Profile("RoomPlanner")], RoomPlanner.prototype, "loop", null);

exports.roomPlanner = new RoomPlanner();
},{"../data/data":"LiCI","../telemetry/profiler":"m431"}],"ZCfc":[function(require,module,exports) {
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

const efficiency_1 = require("./telemetry/efficiency");

const statistics_1 = require("./telemetry/statistics");

const reporter_1 = require("./telemetry/reporter");

const geographer_1 = require("./room/geographer");

const creep_harasser_1 = require("./creep/creep.harasser");

const creep_remoteminer_1 = require("./creep/creep.remoteminer");

const room_planner_1 = require("./construction/room-planner");

exports.loop = function () {
  profiler_1.profiler.trackMethod("Game::Start", Game.cpu.getUsed());
  profiler_1.profiler.tick();
  const trackId = profiler_1.profiler.track("Game loop");

  for (var name in Memory.creeps) {
    if (!Game.creeps[name]) {
      delete Memory.creeps[name];
      console.log("Clearing non-existing creep memory:", name);
    }
  }

  room_1.roomManager.initRooms();
  room_planner_1.roomPlanner.loop();
  geographer_1.geographer.loop();
  construction_1.constructionManager.loop();
  spawn_1.spawnManager.loop();
  tower_1.towerManager.loop();
  creep_miner_1.minerCreepManager.loop();
  creep_carry_1.carryCreepManager.loop();
  creep_harasser_1.harasserCreepManager.loop();
  creep_remoteminer_1.remoteMinerCreepManager.loop();
  creep_1.creepManager.loop();
  messaging_1.messaging.loop();
  efficiency_1.efficiency.loop();
  statistics_1.stats.loop();
  reporter_1.reporter.loop();
  profiler_1.profiler.finish(trackId);
};
},{"./spawn":"5vzf","./telemetry/profiler":"m431","./room":"yJHy","./construction":"WjBd","./tower":"k11/","./creep/creep.miner":"kl90","./creep/creep.carry":"LqpF","./creep/creep":"o7HM","./messaging":"xncl","./telemetry/efficiency":"FSRJ","./telemetry/statistics":"KIzw","./telemetry/reporter":"M39x","./room/geographer":"gAKg","./creep/creep.harasser":"cUlm","./creep/creep.remoteminer":"UET0","./construction/room-planner":"qN3n"}]},{},["ZCfc"], null)