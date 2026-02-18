type DirectorListener = (effect: string) => void;

const listeners = new Set<DirectorListener>();

export function subscribeDirector(cb: DirectorListener) {

  listeners.add(cb);

  return () => {
    listeners.delete(cb);
  };

}

export function triggerDirector(effect: string) {

  listeners.forEach(cb => cb(effect));

}
