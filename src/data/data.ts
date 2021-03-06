import { stats } from "../telemetry/statistics";
import { RoomQueries, GameQueries } from "./query";
import { Temporal, temporalize } from "./cache/temporal";
import { RoomProvider } from "../util";
import { MemoryStore } from "./memory/memory-store";

class BaseData {
  protected storeTo<T>(
    key: string,
    cache: Record<string, T>,
    func: () => T
  ): T {
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

  private creepsByJob: Record<string, Temporal<Creep[]>> = {};
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

  private roomDataProvider = new RoomProvider(r =>
    temporalize(new RoomQueries(r))
  );

  public of(room: Room) {
    return this.roomDataProvider.of(room);
  }
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
