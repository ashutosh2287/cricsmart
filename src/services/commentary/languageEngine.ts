export function translateCommentary(text: string, lang: "EN" | "HI") {

  if (lang === "EN") return text;

  // simple Hindi mapping (can upgrade later)
  return text
    .replace("FOUR", "चार")
    .replace("SIX", "छक्का")
    .replace("OUT", "आउट")
    .replace("Dot ball", "डॉट बॉल")
    .replace("run", "रन");
}