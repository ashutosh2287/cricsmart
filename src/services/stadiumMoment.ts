type MomentType = "SIX" | "FOUR" | "WICKET";

type Listener = (moment: MomentType) => void;

const listeners = new Set<Listener>();

export function triggerStadiumMoment(moment: MomentType) {

  listeners.forEach(cb => cb(moment));

}

export function subscribeStadiumMoment(cb: Listener) {

  listeners.add(cb);

  return () => {
  listeners.delete(cb);
};

}
