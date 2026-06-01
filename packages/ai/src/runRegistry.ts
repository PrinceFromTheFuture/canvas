/**
 * In-process registry of active runs -> AbortController. Cancellation has two
 * layers: a cross-process Redis flag (so any node can request cancel) and
 * this local map (so the node actually executing the run can abort its
 * in-flight model stream). The worker polls the Redis flag and calls abort()
 * here.
 */
const controllers = new Map<string, AbortController>();

export function registerRun(runId: string): AbortController {
  const controller = new AbortController();
  controllers.set(runId, controller);
  return controller;
}

export function abortRun(runId: string): boolean {
  const controller = controllers.get(runId);
  if (!controller) return false;
  controller.abort();
  return true;
}

export function unregisterRun(runId: string): void {
  controllers.delete(runId);
}

export function hasRun(runId: string): boolean {
  return controllers.has(runId);
}
