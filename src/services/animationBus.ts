type AnimationEvent = {
  type: "SIX" | "FOUR" | "WICKET";
};

type AnimationListener = (event: AnimationEvent) => void;

let listeners: AnimationListener[] = [];

export function publishAnimation(event: AnimationEvent) {
  

  listeners.forEach(l => l(event));

}

export function subscribeAnimation(listener: AnimationListener) {

  listeners.push(listener);

  return () => {
    listeners = listeners.filter(l => l !== listener);
  };

}
