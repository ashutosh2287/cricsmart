import { Match } from "../types/match";

type Listener = (data: Match[]) => void;

let listeners: Listener[] = [];

export function subscribe(listener: Listener) {

  listeners.push(listener);

  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };

}

export function emit(data: Match[]) {
  listeners.forEach((listener) => listener(data));
}
