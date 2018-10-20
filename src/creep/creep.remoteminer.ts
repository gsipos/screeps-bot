import { creepManager } from "./creep";
import { data } from "../data/data";

// moveToAnother room
// find source
// harvest
// flee from enemy
// go back
// fill source


class RemoteMinerCreepManager {
  public remoteMinerJobs = [

  ];

  public loop() {
    data.remoteMinerCreeps.get().forEach(this.processCreep);
  }

  private processCreep = (c: Creep) => creepManager.processCreep(c, this.remoteMinerJobs);
}

export const remoteMinerCreepManager = new RemoteMinerCreepManager();
