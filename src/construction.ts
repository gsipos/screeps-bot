import { roomManager } from "./room";
import { data } from "./data/data";
import { Profile } from "./telemetry/profiler";

interface HasMemory {
  memory: any;
}

class ConstructionManager {
  @Profile("Construction")
  public loop() {
    for (let roomName in Game.rooms) {
      const room = Game.rooms[roomName];
      this.buildMiningContainers(room);
    }
  }

  buildMiningContainers(room: Room) {
    const roomData = data.of(room);
    const containers = roomData.containers.get();
    const containersUnderConstruction = roomData.containerConstructions.get();
    const currentContainers =
      containers.length + containersUnderConstruction.length;

    if (currentContainers === 5) {
      return;
    }

    const miningFlags = roomData.miningFlags.get();
    const maxContainers = Math.min(
      5,
      miningFlags.length,
      roomData.sources.get().length
    );

    if (currentContainers === maxContainers) {
      return;
    }
    const minerSources = roomData.minerCreeps.get().map(this.memorySource);
    const coveredSources: string[] = miningFlags
      .filter(this.memoryChosen)
      .map(this.memorySource)
      .concat(minerSources);

    const buildableFlags = miningFlags.filter(
      flag => !coveredSources.includes(flag.memory.source)
    );

    const spawn = roomData.spawns.get()[0];

    const chosen = spawn.pos.findClosestByPath<Flag>(FIND_FLAGS, {
      filter: (f: Flag) => buildableFlags.includes(f)
    });
    if (chosen) {
      chosen.memory.chosen = true;
      chosen.pos.createConstructionSite(STRUCTURE_CONTAINER);
      roomData.containerConstructions.clear();
    } else {
      console.log(
        "WARN: no chosen buildable flag",
        coveredSources,
        buildableFlags,
        chosen
      );
    }
  }

  private memorySource = (item: HasMemory) => item.memory.source;
  private memoryChosen = (item: HasMemory) => item.memory.chosen;
}

export const constructionManager = new ConstructionManager();
