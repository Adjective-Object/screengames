import SocketEventQueue from "../SocketEventQueue";

describe("SocketEventQueue", () => {
  let queue;

  beforeEach(() => {
    queue = new SocketEventQueue(400);
  });

  it("throws an error when receiving an event without a seq", () => {
    expect(() => queue.ingestEvent({})).toThrow();
  });

  it("throws an error when receiving an event with a non-numeric seq", () => {
    expect(() => queue.ingestEvent({ seq: "one" })).toThrow();
    expect(() => queue.ingestEvent({ seq: "1" })).toThrow();
    expect(() => queue.ingestEvent({ seq: {} })).toThrow();
  });

  it("throws an error when receiving an event with a negative seq", () => {
    expect(() => queue.ingestEvent({ seq: -1 })).toThrow();
    expect(() => queue.ingestEvent({ seq: 0 })).toThrow();
  });

  it("sends events immediately when receiving them in sequence", () => {
    let evt1 = { seq: 1, payload: "What's up" };
    let evt2 = { seq: 2, payload: "It's Ya Boi" };
    let evt3 = { seq: 3, payload: "Frank" };
    queue.ingestEvent(evt1);
    expect(queue.getEvents()).toEqual([evt1]);
    queue.ingestEvent(evt2);
    expect(queue.getEvents()).toEqual([evt1, evt2]);
    queue.ingestEvent(evt3);
    expect(queue.getEvents()).toEqual([evt1, evt2, evt3]);
  });

  it("throws an error when receiving an event multiple times", () => {
    let evt1 = { seq: 1, payload: "Hey Guys, sorry I haven't been updating" };
    queue.ingestEvent(evt1);
    expect(queue.getEvents()).toEqual([evt1]);
    expect(() => queue.ingestEvent(evt1)).toThrow();
  });

  it("throws an error when the client queues too many events", () => {
    // Queue events up to the limit, skipping seq 1 so that the ingested
    // events are queued instead of sent
    for (let i = 1; i < 400; i++) {
      queue.ingestEvent({ seq: i + 1 });
    }

    // Queue events up to the limit, skipping 0
    expect(() =>
      queue.ingestEvent({
        seq: 400
      })
    ).toThrow();
  });

  it("Sends queued events in seq order when sequence has been received", () => {
    let evt1 = { seq: 1 };
    let evt2 = { seq: 2 };
    let evt3 = { seq: 3 };
    let evt4 = { seq: 4 };
    queue.ingestEvent(evt3);
    expect(queue.getEvents()).toEqual(
      [],
      "No event should be send when pending messages exist"
    );
    queue.ingestEvent(evt2);
    expect(queue.getEvents()).toEqual([]);
    queue.ingestEvent(evt4);
    expect(queue.getEvents()).toEqual([]);
    queue.ingestEvent(evt1);
    expect(queue.getEvents()).toEqual([evt1, evt2, evt3, evt4]);
  });
});
