// @flow

export type GenericEvent = {
  type: string,
};

export interface IEventConsumer<TEvent> {
  /**
   * Check that an event can be ingested by this event consumer
   */
  castEvent(e: GenericEvent): TEvent | null,

  /**
   * Process the event to some effect. Return true if the
   * state has been changed such that a re-render is required
   **/
  ingestEvent(e: TEvent): boolean,
}
