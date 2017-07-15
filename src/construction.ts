import { roomManager } from './room';
import { findStructures } from './util';
class ConstructionManager {

  public loop() {
    for (let roomName in Game.rooms) {
      const room = Game.rooms[roomName];
      this.buildMiningContainers(room);
    }
  }

  buildMiningContainers(room: Room) {
    const containers = findStructures<Container>(room, [STRUCTURE_CONTAINER], FIND_STRUCTURES);
    const containersUnderConstruction = findStructures(room, [STRUCTURE_CONTAINER], FIND_MY_CONSTRUCTION_SITES);
    const currentContainers = containers.length + containersUnderConstruction.length;

    if (currentContainers === 5) {
      return;
    }

    const miningFlags = roomManager.getMiningFlags(room);
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
  }

}

export const constructionManager = new ConstructionManager;
