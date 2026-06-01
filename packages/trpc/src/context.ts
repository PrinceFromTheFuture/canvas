/**
 * Request context. `userId` is resolved by the HTTP adapter (Next route) from
 * the session cookie; the viewer is anonymous (userId null). Keeping context
 * minimal makes the routers easy to reason about.
 */
export interface Context {
  userId: string | null;
}

export interface CreateContextArgs {
  userId: string | null;
}

export function createContext(args: CreateContextArgs): Context {
  return { userId: args.userId };
}
