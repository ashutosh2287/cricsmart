import { Match } from "../types/match";

type CommentaryListener = (data: string[]) => void;

let listeners: CommentaryListener[] = [];

let commentary: string[] = [
  "17.4 - FOUR! Beautiful cover drive.",
  "17.3 - Single taken.",
  "17.2 - Dot ball."
];

export const subscribeCommentary = (listener: CommentaryListener) => {

  listeners.push(listener);

  listener(commentary);

  return () => {
    listeners = listeners.filter(l => l !== listener);
  };

};

// ⭐ Fake realtime commentary generator

export const startCommentaryStream = () => {

  setInterval(() => {

    const randomEvents = [
      "FOUR! Driven through covers.",
      "Single taken.",
      "Dot ball.",
      "Huge SIX over midwicket!",
      "Appeal! Not out.",
      "Quick two runs."
    ];

    const random = randomEvents[
      Math.floor(Math.random() * randomEvents.length)
    ];

    commentary = [
      `${Math.floor(Math.random()*20)}.${Math.floor(Math.random()*6)} - ${random}`,
      ...commentary
    ];

    listeners.forEach(l => l(commentary));

  }, 3000);

};
