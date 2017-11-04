// @flow
import type { EventConsumer, Event } from './EventConsumer';

export type EventTrigger = () => void;

export default class EventDispatcher {
  consumers: EventConsumer[];
  triggers: EventTrigger[];

  constructor() {
    this.consumers = [];
    this.triggers = [];
  }

  addConsumer(consumer: EventConsumer): EventDispatcher {
    this.consumers.push(consumer);
    return this;
  }

  addUpdateTrigger(trigger: EventTrigger): EventDispatcher {
    this.triggers.push(trigger);
    return this;
  }

  consumeEvent(event: Event) {
    let should_update = this._consumeEventWithoutUpdatingTriggers(event);
    if (should_update) {
      this._updateAllTriggers();
    }
  }

  consumeEvents(events: Event[]) {
    let should_update = events
      .map(event => this._consumeEventWithoutUpdatingTriggers(event))
      .reduce((r1, r2) => r1 || r2, false);
    if (should_update) {
      this._updateAllTriggers();
    }
  }

  _consumeEventWithoutUpdatingTriggers(event: Event): boolean {
    return this.consumers
      .filter(consumer => consumer.canIngestEvent(event))
      .map(consumer => consumer.ingestEvent(event))
      .reduce((r1, r2) => r1 || r2, false);
  }

  _updateAllTriggers() {
    for (let trigger of this.triggers) {
      trigger();
    }
  }
}
