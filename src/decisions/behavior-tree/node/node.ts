import { BehaviorTreeStatus, FAILED, SUCCESS } from "../behavior-tree-status";

export interface BehaviorTreeNode<State> {
  tick(state: State): BehaviorTreeStatus;
}

export interface BehaviorTreeParentNode<State> extends BehaviorTreeNode<State> {
  addChild(child: BehaviorTreeNode<State>): void;
}

export class ActionNode<State> implements BehaviorTreeNode<State> {
  constructor(
    public readonly name: string,
    public readonly action: (state: State) => BehaviorTreeStatus
  ) {}

  public tick(state: State) {
    const result = this.action(state);
    if (!result) {
      throw new Error("No return value in action node " + this.name);
    }
    return result;
  }
}

export class InverterNode<State> implements BehaviorTreeParentNode<State> {
  private child?: BehaviorTreeNode<State>;

  constructor(public name: string) {}

  tick(state: State) {
    if (!this.child) {
      throw new Error("No inverter child " + this.name);
    }
    const result = this.child.tick(state);
    if (result === BehaviorTreeStatus.failed) {
      return BehaviorTreeStatus.success;
    } else if (result === BehaviorTreeStatus.success) {
      return BehaviorTreeStatus.failed;
    }
    return result;
  }

  addChild(child: BehaviorTreeNode<State>) {
    this.child = child;
  }
}

export class SequenceNode<State> implements BehaviorTreeParentNode<State> {
  private children: BehaviorTreeNode<State>[] = [];

  constructor(public name: string) {}

  tick(state: State) {
    let lastStatus: BehaviorTreeStatus = BehaviorTreeStatus.failed;
    const allSucceded = this.children.every(child => {
      lastStatus = child.tick(state);
      return lastStatus === BehaviorTreeStatus.success;
    });
    if (allSucceded) {
      return BehaviorTreeStatus.success;
    } else {
      return lastStatus;
    }
  }

  addChild(child: BehaviorTreeNode<State>) {
    this.children.push(child);
  }
}

export class SelectorNode<State> implements BehaviorTreeParentNode<State> {
  private children: BehaviorTreeNode<State>[] = [];

  constructor(public name: string) { }

  tick(state: State) {
    let lastStatus: BehaviorTreeStatus = FAILED;
    const someSucceed = this.children.some(child => {
      lastStatus = child.tick(state);
      return lastStatus === BehaviorTreeStatus.success;
    })
    return someSucceed ? SUCCESS : FAILED;
  }

  addChild(child: BehaviorTreeNode<State>) {
    this.children.push(child);
  }
}

export class ParalellNode<State> implements BehaviorTreeParentNode<State> {
  private children: BehaviorTreeNode<State>[] = [];

  constructor(
    public name: string,
    private requiredToFail: number = 0,
    private requiredToSucceed: number = 0
  ) { }

  tick(state: State) {
    const statuses = this.children.map(c => c.tick(state));
    const succeeded = statuses.filter(s => s === SUCCESS).length;
    const failed = statuses.filter(s => s === FAILED).length;

    if (this.requiredToSucceed > 0 && succeeded >= this.requiredToSucceed) {
      return BehaviorTreeStatus.success;
    }

    if (this.requiredToFail > 0 && failed >= this.requiredToFail) {
      return BehaviorTreeStatus.failed;
    }

    return BehaviorTreeStatus.running;
  }

  addChild(child: BehaviorTreeNode<State>) {
    this.children.push(child);
  }
}
