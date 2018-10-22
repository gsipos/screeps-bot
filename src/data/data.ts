import { stats } from "../telemetry/statistics";
import { RoomQueries, GameQueries } from "./query";
import { Temporal } from "./cache/temporal";
import { RoomProvider } from "../util";
import { geographer } from "../room/geographer";
import { MemoryStore } from "./memory/memory-store";

type HashObject<T> = Record<string, T>;

class BaseData {
  protected storeTo<T>(key: string, cache: HashObject<T>, func: () => T): T {
    if (!cache[key]) {
      cache[key] = func();
    } else {
    }
    return cache[key];
  }

  protected getDistanceKey(from: RoomPosition, to: RoomPosition) {
    return `${from.roomName}|${from.x}:${from.y}|${to.x}:${to.y}`;
  }
}

class Data extends BaseData {
  private gameQueries = new GameQueries();

  private creepsByJob: HashObject<Temporal<Creep[]>> = {};
  public rooms = new Temporal(this.gameQueries.rooms);
  public creeps = new Temporal(this.gameQueries.creeps);
  public minerCreeps = new Temporal(this.gameQueries.minerCreeps);
  public carryCreeps = new Temporal(this.gameQueries.carryCreeps);
  public generalCreeps = new Temporal(this.gameQueries.generalCreeps);
  public harasserCreeps = new Temporal(this.gameQueries.harasserCreeps);
  public remoteMinerCreeps = new Temporal(this.gameQueries.remoteMinerCreeps);

  public creepsByJobTarget(job: string, jobTarget: string) {
    const getCreeps = () =>
      this.creeps
        .get()
        .filter(c => c.memory.job === job && c.memory.jobTarget === jobTarget);
    return this.storeTo(
      job + "|" + jobTarget,
      this.creepsByJob,
      () => new Temporal(getCreeps)
    ).get();
  }

  public registerCreepJob(creep: Creep) {
    this.creepsByJobTarget(creep.memory.job, creep.memory.jobTarget).push(
      creep
    );
  }

  private roomDataProvider = new RoomProvider(r => new RoomData(r));

  public of(room: Room) {
    return this.roomDataProvider.of(room);
  }
}

export class RoomData {
  constructor(private room: Room) {}

  queries = new RoomQueries(this.room);

  public sources = new Temporal(this.queries.sources);
  public spawns = new Temporal(this.queries.spawns);
  public containers = new Temporal(this.queries.containers);
  public storage = new Temporal(() => this.room.storage);
  public containerOrStorage = new Temporal(this.queries.containerOrStorage);
  public extensions = new Temporal(this.queries.extensions);
  public extensionOrSpawns = new Temporal(this.queries.extensionOrSpawns);

  public towers = new Temporal(this.queries.towers);
  public ramparts = new Temporal(this.queries.ramparts);
  public walls = new Temporal(this.queries.walls);
  public roads = new Temporal(this.queries.roads);
  public miningFlags = new Temporal(this.queries.miningFlags);
  public containerConstructions = new Temporal(
    this.queries.containerConstructions
  );
  public hostileCreeps = new Temporal(this.queries.hostileCreeps);
  public hostileStructures = new Temporal(this.queries.hostileStructures);
  public hostileTowers = new Temporal(this.queries.hostileTowers);

  public nonDefensiveStructures = new Temporal(
    this.queries.nonDefensiveStructures
  );

  public creeps = new Temporal(this.queries.creeps);
  public minerCreeps = new Temporal(this.queries.minerCreeps);
  public carryCreeps = new Temporal(this.queries.carryCreeps);
  public generalCreeps = new Temporal(this.queries.generalCreeps);
  public fillableCreeps = new Temporal(this.queries.fillableCreeps);
  public remoteMinerCreeps = new Temporal(this.queries.remoteMinerCreeps);

  public neighbourRooms = new Temporal(() =>
    geographer.describeNeighbours(this.room)
  );
}

class PathStore extends BaseData {
  private store = new MemoryStore("pathStore");

  public getPath(room: Room, from: RoomPosition, to: RoomPosition) {
    const key = this.getDistanceKey(from, to);

    if (!this.store.has(key)) {
      const path = room.findPath(from, to, {
        serialize: true,
        ignoreCreeps: true
      });
      this.store.set(key, path as any);
      stats.metric("PathStore::miss", 1);
    } else {
      stats.metric("PathStore::hit", 1);
    }
    return this.store.get(key);
  }

  public renewPath(room: Room, from: RoomPosition, to: RoomPosition) {
    stats.metric("PathStore::renew", 1);
    const key = this.getDistanceKey(from, to);
    this.store.delete(key);
    return this.getPath(room, from, to);
  }
}

export const data = new Data();
export const pathStore = new PathStore();
