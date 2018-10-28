import { BehaviorTreeStatus } from "./behavior-tree-status";
import { BehaviorTreeNode, ActionNode, InverterNode, SequenceNode, SelectorNode, ParalellNode } from "./node/node";

export function selector<S>(name: string, children: BehaviorTreeNode<S>[]) {
  const node = new SelectorNode<S>(name);
  children.forEach(c => node.addChild(c));
  return node;
}

export function inverter<S>(name: string, child: BehaviorTreeNode<S>) {
  const node = new InverterNode<S>(name);
  node.addChild(child);
  return node;
}

export function sequence<S>(name: string, children: BehaviorTreeNode<S>[]) {
  const node = new SequenceNode<S>(name);
  children.forEach(c => node.addChild(c));
  return node;
}

export function parallel<S>(name: string, requiredTofail: number, requiredToSucceed: number, children: BehaviorTreeNode<S>[]) {
  const node = new ParalellNode<S>(name, requiredTofail, requiredToSucceed);
  children.forEach(c => node.addChild(c));
  return node;
};

export function action<S>(name: string, action: (state: S) => BehaviorTreeStatus) {
  return new ActionNode<S>(name, action);
}

export function condition<S>(name: string, predicate: (state: S) => boolean) {
  return new ActionNode<S>(name, s => predicate(s) ? BehaviorTreeStatus.success : BehaviorTreeStatus.failed)
}

export function mapState<S, U>(name: string, map: (state: S) => U, child: BehaviorTreeNode<U>) {
  return { tick: (state: S) => child.tick(map(state)) };
}
