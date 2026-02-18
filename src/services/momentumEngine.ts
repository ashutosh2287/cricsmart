import { subscribeCommand, Command } from "./commandBus";

let momentum = 0;

const listeners = new Set<(value:number)=>void>();

export function subscribeMomentum(cb:(value:number)=>void){
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function emitMomentum(){
  listeners.forEach(l => l(momentum));
}

/*
================================================
MOMENTUM LOGIC
================================================
*/

function handleCommand(command: Command){

  switch(command.type){

    case "RUN_SCORED":
      momentum += 1;
      break;

    case "BOUNDARY_FOUR":
      momentum += 3;
      break;

    case "BOUNDARY_SIX":
      momentum += 5;
      break;

    case "WICKET_FALL":
      momentum += 8;
      break;
  }

  // decay slowly (avoid infinite growth)
  momentum = Math.max(0, momentum - 1);

  emitMomentum();
}

/*
================================================
INIT MOMENTUM ENGINE
================================================
*/

export function initMomentumEngine(){
  subscribeCommand(handleCommand);
}
