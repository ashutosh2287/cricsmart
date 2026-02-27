import { CommentaryEvent } from "./commentaryTypes";

const listeners = new Set<(event: CommentaryEvent) => void>();

export function subscribeCommentary(
  cb: (event: CommentaryEvent) => void
) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function emitCommentary(event: CommentaryEvent) {
  listeners.forEach((l) => l(event));
}