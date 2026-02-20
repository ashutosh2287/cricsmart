// services/commandBus.ts

export type Command =
  | { type: "RUN_SCORED"; slug: string;runs: number }
  | { type: "BOUNDARY_FOUR"; slug: string }
  | { type: "BOUNDARY_SIX"; slug: string }
  | { type: "WICKET_FALL" ; slug: string};

type CommandListener = (command: Command) => void;

const listeners = new Set<CommandListener>();

export function subscribeCommand(cb: CommandListener) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function emitCommand(command: Command) {
  listeners.forEach(l => l(command));
}
