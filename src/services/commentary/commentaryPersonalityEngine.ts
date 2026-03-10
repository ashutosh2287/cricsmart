// src/services/commentary/commentaryPersonalityEngine.ts

export type CommentaryPersonality =
  | "ANALYST"
  | "HYPE"
  | "TACTICAL";

export function applyCommentaryPersonality(
  baseLine: string,
  personality: CommentaryPersonality
): string {

  switch (personality) {

    case "ANALYST":
      return `${baseLine} From an analytical standpoint, this moment could influence the match significantly.`;

    case "HYPE":
      return `${baseLine} What a moment! The crowd absolutely loves it!`;

    case "TACTICAL":
      return `${baseLine} Tactically, this changes the field dynamics and bowling plans.`;

    default:
      return baseLine;

  }

}