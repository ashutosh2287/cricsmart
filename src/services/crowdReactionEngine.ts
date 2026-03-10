import { subscribeDirectorSignal } from "./directorSignalBus";

type CrowdListener = (reaction: string) => void;

let listeners: CrowdListener[] = [];

export function subscribeCrowdReaction(listener: CrowdListener) {
  listeners.push(listener);

  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function emit(reaction: string) {
  listeners.forEach((l) => l(reaction));
}

export function initCrowdReactionEngine() {

  subscribeDirectorSignal((signal) => {

    switch (signal.type) {

      case "HIGHLIGHT_DETECTED":

        if (signal.subtype === "SIX") {
          emit("ROAR");
        }

        if (signal.subtype === "WICKET") {
          emit("SHOCK");
        }

        break;

      case "ASSAULT_PHASE":
        emit("HYPE");
        break;

      case "COLLAPSE_ALERT":
        emit("TENSION");
        break;

    }

  });

}