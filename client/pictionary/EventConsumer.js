// @flow
import type { Events as CameraEvents } from './Camera';
import type { Events as DrawingEvents } from './Drawing';
export type Event = CameraEvents | DrawingEvents;

export interface EventConsumer {
  /**
   * Check that an event can be ingested by this event consumer
   */
  canIngestEvent(e: Event): boolean,

  /**
   * Process the event to some effect. Return true if the
   * state has been changed such that a re-render is required
   **/
  ingestEvent(e: Event): boolean,
}
