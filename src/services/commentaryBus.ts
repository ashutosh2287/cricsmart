export type Commentary = {
  text: string;
  timestamp: number;
};

let listeners: ((comment: Commentary) => void)[] = [];

export function publishCommentary(text: string) {

  const comment = {
    text,
    timestamp: Date.now()
  };

  listeners.forEach(l => l(comment));
}

export function subscribeCommentary(cb: (c: Commentary) => void) {

  listeners.push(cb);

  return () => {
    listeners = listeners.filter(l => l !== cb);
  };
}
