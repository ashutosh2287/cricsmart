import { registerReplayConsumer } from "@/domain/consumers/replayConsumer";
import { registerSseConsumer } from "@/domain/consumers/sseConsumer";
import { registerWinProbabilityConsumer } from "@/domain/consumers/winProbabilityConsumer";

let domainConsumersRegistered = false;

export function ensureDomainConsumersRegistered(): void {
  if (domainConsumersRegistered) return;
  if (typeof window !== "undefined") return;

  registerReplayConsumer();
  registerSseConsumer();
  registerWinProbabilityConsumer();

  domainConsumersRegistered = true;
}
