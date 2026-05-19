import { registerReplayConsumer } from "@/domain/consumers/replayConsumer";
import { registerSseConsumer } from "@/domain/consumers/sseConsumer";

let domainConsumersRegistered = false;

export function ensureDomainConsumersRegistered(): void {
  if (domainConsumersRegistered) return;
  if (typeof window !== "undefined") return;

  registerReplayConsumer();
  registerSseConsumer();

  domainConsumersRegistered = true;
}
