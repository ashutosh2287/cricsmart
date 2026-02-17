type Task = () => void;

let queue: Task[] = [];
let scheduled = false;

/*
====================================
FRAME LOOP
====================================
*/

function flush() {

  scheduled = false;

  const tasks = [...queue];
  queue = [];

  tasks.forEach(task => task());

}

/*
====================================
PUBLIC API
====================================
*/

export function scheduleCinematic(task: Task) {

  queue.push(task);

  if (!scheduled) {

    scheduled = true;

    // browser-safe check (important for Next.js)
    if (typeof window !== "undefined") {
      requestAnimationFrame(flush);
    } else {
      // fallback (SSR safety)
      setTimeout(flush, 16);
    }

  }

}
