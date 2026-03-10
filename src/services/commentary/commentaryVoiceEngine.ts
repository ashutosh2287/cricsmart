import { subscribeCommentary } from "./commentaryBus";

export function initCommentaryVoice() {

  if (typeof window === "undefined") return;

  subscribeCommentary((commentary) => {

    if (!commentary?.text) return;

    const utterance = new SpeechSynthesisUtterance(commentary.text);

    // Voice selection
    const voices = speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith("en"));

    if (voice) {
      utterance.voice = voice;
    }

    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    speechSynthesis.speak(utterance);

  });

}