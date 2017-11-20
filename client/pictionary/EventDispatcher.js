// @flow
import type { IEventConsumer, GenericEvent } from '../common/IEventConsumer';
import filterNulls from '../../util/filter-nulls';

export type EventTrigger = () => void;

export default class EventDispatcher {
  consumers: IEventConsumer<*>[];
  triggers: EventTrigger[];

  constructor() {
    this.consumers = [];
    this.triggers = [];
  }

  addConsumer(consumer: IEventConsumer<*>): EventDispatcher {
    this.consumers.push(consumer);
    return this;
  }

  addUpdateTrigger(trigger: EventTrigger): EventDispatcher {
    this.triggers.push(trigger);
    return this;
  }

  consumeEvent(event: GenericEvent) {
    let should_update = this._consumeEventWithoutUpdatingTriggers(event);
    if (should_update) {
      this._updateAllTriggers();
    }
  }

  consumeEvents(events: GenericEvent[]) {
    let should_update = events
      .map(event => this._consumeEventWithoutUpdatingTriggers(event))
      .reduce((r1, r2) => r1 || r2, false);
    if (should_update) {
      this._updateAllTriggers();
    }
  }

  _consumeEventWithoutUpdatingTriggers(event: GenericEvent): boolean {
    return this.consumers
      .map(consumer => {
        let typed_event = consumer.castEvent(event);
        return typed_event !== null ? consumer.ingestEvent(typed_event) : false;
      })
      .reduce((r1, r2) => r1 || r2, false);
  }

  _updateAllTriggers() {
    for (let trigger of this.triggers) {
      trigger();
    }
  }
}
