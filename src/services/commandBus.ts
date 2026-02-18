// services/commandBus.ts

export type Command =
  | { type: "RUN_SCORED"; runs: number }
  | { type: "BOUNDARY_FOUR" }
  | { type: "BOUNDARY_SIX" }
  | { type: "WICKET_FALL" };

type CommandListener = (command: Command) => void;

const listeners = new Set<CommandListener>();

export function subscribeCommand(cb: CommandListener) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function emitCommand(command: Command) {
  listeners.forEach(l => l(command));
}
