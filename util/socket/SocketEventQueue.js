import _ from 'lodash';
/*
type ClientEventQueue {
    queuedEvents: {},
    maxSeq: number,
    pendingSeq: number[],
}
*/

/**
 * Manages incoming socket events by client to ensure that messages from a given
 * client are processed in sending order. Assumes that all events received from
 * the client have a 'seq' attribute on them that is numeic and strictly
 * ascending
 */

export default class SocketEventQueue {
  constructor(EVENT_QUEUE_LIMIT) {
    this.queuedEvents = [];
    this.maxSeq = 0;
    this.pendingSeq = [];
    this.queuedSeq = [];
    this.outgoingEvents = [];
  }

  ingestEvent(event) {
    if (!Number.isInteger(event.seq)) {
      throw new Error(`event.seq (${event.seq}) is not a number`);
    }
    if (!event.seq >= 1) {
      throw new Error(`event.seq (${event.seq}) is not >= 1`);
    }
    // Remove clients who are performing socket-queueing attacks on the server
    if (event.seq - this.maxSeq > this.EVENT_QUEUE_LIMIT) {
      throw new Error(`Client missing > ${this.EVENT_QUEUE_LIMIT} events`);
    }

    // If the pending queue is empty and the event is the next expected
    // one, send it immediately
    if (this.queuedEvents.length === 0 && this.maxSeq + 1 === event.seq) {
      this.__sendEvent(event);
      this.maxSeq++;
      return;
    }

    let pending_seq_queue_index = this.pendingSeq.indexOf(event.seq);
    if (pending_seq_queue_index !== -1) {
      this.pendingSeq.splice(pending_seq_queue_index, 1);
    } else if (event.seq <= this.maxSeq) {
      throw new Error(
        'Ingested non-pending event with seq ${event.seq}. Duplicate event?',
      );
    }

    // Queue the message & update maxSeq / pendingQueue
    this.__addEventToQueue(event);

    // If pendingSeq is empty, send all messages in the queuedMessages.
    if (this.pendingSeq.length === 0) {
      // Empty the event queue
      let events_to_send = this.queuedEvents;
      this.queuedEvents = [];
      this.queuedSeq = [];
      // Send all events in the queue
      // TODO yield context while sending to allow intake of new events &
      // processng client events
      for (let event of events_to_send) {
        this.__sendEvent(event);
      }
    }
  }

  /**
   * Insert an event into an event queue maintaining ordering by index
   */
  __addEventToQueue(event) {
    let i = 0;
    while (
      i < this.queuedEvents.length &&
      this.queuedEvents[i].seq < event.seq
    ) {
      i++;
    }
    this.queuedEvents.splice(i, 0, event);
    this.queuedSeq.push(event.seq);
    let new_pending = _.range(Math.max(this.maxSeq, 1), event.seq).filter(
      i => this.queuedSeq.indexOf(i) === -1,
    );
    if (this.queuedEvents.length % 100 == 0) {
      console.warn(
        `event queue reached ${this.queuedEvents.length} pending events`,
      );
    }
    this.pendingSeq = this.pendingSeq.concat(new_pending);
    this.maxSeq = Math.max(this.maxSeq, event.seq);
  }

  __sendEvent(event) {
    this.outgoingEvents.push(event);
  }

  getEvents(event) {
    return this.outgoingEvents;
  }

  clearEvents(event) {
    this.outgoingEvents = [];
  }
}
