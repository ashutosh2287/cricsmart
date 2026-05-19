import { initAnalyticsConsumer } from "@/domain/consumers/analyticsConsumer";
import { initReplayConsumer } from "@/domain/consumers/replayConsumer";
import { initSseConsumer } from "@/domain/consumers/sseConsumer";

let initialized = false;

export function initDomainConsumers() {
  if (initialized) return;

  initReplayConsumer();
  initSseConsumer();
  initAnalyticsConsumer();

  initialized = true;
}
