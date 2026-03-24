export function getMatchResult(
  teamA: string,
  teamB: string,
  scoreA: number,
  scoreB: number,
  wicketsLeft: number
) {
  if (scoreA > scoreB) {
    return {
      winner: teamA,
      winBy: `${scoreA - scoreB} runs`,
    };
  }

  if (scoreB > scoreA) {
    return {
      winner: teamB,
      winBy: `${wicketsLeft} wickets`,
    };
  }

  return {
    winner: "Match Draw",
    winBy: "",
  };
}