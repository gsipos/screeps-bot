import { roomManager } from './room';
import { data } from './data';
import { Profile } from './profiler';

class ConstructionManager {

  @Profile('Construction')
  public loop() {
    for (let roomName in Game.rooms) {
      const room = Game.rooms[roomName];
      this.buildMiningContainers(room);
    }
  }

  buildMiningContainers(room: Room) {
    const containers = data.roomContainers(room);
    const containersUnderConstruction = data.roomContainerConstruction(room);
    const currentContainers = containers.length + containersUnderConstruction.length;

    if (currentContainers === 5) {
      return;
    }

    const miningFlags = data.roomMiningFlags(room);
    const maxContainers = Math.min(5, miningFlags.length);

    if (currentContainers === maxContainers) {
      return;
    }

    const buildableFlags = miningFlags
      .filter(flag => containers.every(c => !c.pos.isEqualTo(flag.pos)))
      .filter(flag => containersUnderConstruction.every(c => !c.pos.isEqualTo(flag.pos)));

    const spawn = Object.keys(Game.spawns).map(k => Game.spawns[k]).filter(s => s.room === room)[0];

    const chosen = spawn.pos.findClosestByPath<Flag>(FIND_FLAGS, { filter: (f: Flag) => buildableFlags.indexOf(f) > -1 });
    chosen.pos.createConstructionSite(STRUCTURE_CONTAINER);
    data.roomContainerContructionChanged(room);
  }

}

export const constructionManager = new ConstructionManager;
