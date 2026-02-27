export type CommentaryStyle =
  | "DEFAULT"
  | "HYPER"
  | "ANALYTICAL";

let currentStyle: CommentaryStyle = "DEFAULT";

export function setCommentaryStyle(style: CommentaryStyle) {
  currentStyle = style;
}

export function getCommentaryStyle() {
  return currentStyle;
}