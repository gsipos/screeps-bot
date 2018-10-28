export enum BehaviorTreeStatus {
  success = "SUCCESS",
  running = "RUNNING",
  failed = "FAILED"
}

export function treeSuccess(status: BehaviorTreeStatus) {
  return status === SUCCESS;
}

export const FAILED = BehaviorTreeStatus.failed;
export const SUCCESS = BehaviorTreeStatus.success;
