import Drawing from "../Drawing";
import expect from "expect";
import dataProvider from "../../../util/test/dataProvider";
import log from "../../../util/log";

describe("Drawing", () => {
  const test_drawing_data = {
    "starts as an empty canvas": {
      events: [],
      expected_strokes: {},
      expected_stroke_order: [],
      expected_warning_count: 0
    }
  };

  const test_append_stroke_data = {
    "creates a new stroke for unseen stroke IDs and issues a warning": {
      events: [
        {
          type: "append_stroke",
          stroke_id: "abc",
          point: { x: 1, y: 2 }
        }
      ],
      expected_strokes: {
        abc: {
          points: [{ x: 1, y: 2 }]
        }
      },
      expected_stroke_order: ["abc"],
      expected_warning_count: 1
    },
    "creates a new stroke for points with new stroke_ids": {
      events: [
        {
          type: "append_stroke",
          stroke_id: "bazinga",
          point: { x: 1, y: 2 }
        },
        {
          type: "append_stroke",
          stroke_id: "zimbabwe",
          point: { x: 100, y: 200 }
        }
      ],
      expected_strokes: {
        bazinga: {
          points: [{ x: 1, y: 2 }]
        },
        zimbabwe: {
          points: [{ x: 100, y: 200 }]
        }
      },
      expected_stroke_order: ["bazinga", "zimbabwe"],
      expected_warning_count: 2
    },
    "adds to an existing stroke for points with new stroke_ids": {
      events: [
        {
          type: "append_stroke",
          stroke_id: "shrek",
          point: { x: 1, y: 2 }
        },
        {
          type: "append_stroke",
          stroke_id: "shrek",
          point: { x: 100, y: 200 }
        }
      ],
      expected_strokes: {
        shrek: {
          points: [{ x: 1, y: 2 }, { x: 100, y: 200 }]
        }
      },
      expected_stroke_order: ["shrek"],
      expected_warning_count: 1
    }
  };

  const test_add_stroke_data = {
    "creates a new stroke for unseen stroke IDs": {
      events: [
        {
          type: "add_stroke",
          stroke_id: "mount_nemo",
          point: { x: 1, y: 2 }
        }
      ],
      expected_strokes: {
        mount_nemo: {
          points: [{ x: 1, y: 2 }]
        }
      },
      expected_stroke_order: ["mount_nemo"],
      expected_warning_count: 0
    },
    "creates a new stroke on a filled canvas for points with new stroke_ids": {
      events: [
        {
          type: "add_stroke",
          stroke_id: "foobeeboo",
          point: { x: 1, y: 2 }
        },
        {
          type: "add_stroke",
          stroke_id: "zoobeeboo",
          point: { x: 100, y: 200 }
        }
      ],
      expected_strokes: {
        foobeeboo: {
          points: [{ x: 1, y: 2 }]
        },
        zoobeeboo: {
          points: [{ x: 100, y: 200 }]
        }
      },
      expected_stroke_order: ["foobeeboo", "zoobeeboo"],
      expected_warning_count: 0
    },
    "adds to an existing stroke for points with new stroke_ids and issues a warning": {
      events: [
        {
          type: "add_stroke",
          stroke_id: "gambling_is_a_sin",
          point: { x: 1, y: 2 }
        },
        {
          type: "add_stroke",
          stroke_id: "gambling_is_a_sin",
          point: { x: 100, y: 200 }
        }
      ],
      expected_strokes: {
        gambling_is_a_sin: {
          points: [{ x: 1, y: 2 }, { x: 100, y: 200 }]
        }
      },
      expected_stroke_order: ["gambling_is_a_sin"],
      expected_warning_count: 1
    }
  };

  const test_initialize_data = {
    "sets strokes and strokeOrder on an empty canvas": {
      events: [
        {
          type: "initialize",
          initial_state: {
            strokes: {},
            strokeOrder: []
          }
        }
      ],
      expected_strokes: {},
      expected_stroke_order: [],
      expected_warning_count: 0
    },
    "overwrites strokes and strokeOrder on a canvas with content and issues a warning": {
      events: [
        {
          type: "add_stroke",
          stroke_id: "bluh",
          point: { x: 1, y: 2 }
        },
        {
          type: "initialize",
          initial_state: {
            strokes: {
              kansas: {
                points: [{ x: 1, y: 2 }]
              },
              nebraska: {
                points: [{ x: 100, y: 200 }]
              }
            },
            strokeOrder: ["kansas", "nebraska"]
          }
        }
      ],
      expected_strokes: {
        kansas: {
          points: [{ x: 1, y: 2 }]
        },
        nebraska: {
          points: [{ x: 100, y: 200 }]
        }
      },
      expected_stroke_order: ["kansas", "nebraska"],
      expected_warning_count: 1
    }
  };

  function testDrawing({
    events = [],
    expected_strokes = {},
    expected_stroke_order = [],
    expected_warning_count = 0
  }) {
    log.warn = jest.fn();
    let drawing = new Drawing();
    for (let event of events) {
      drawing.ingestEvent(event);
    }
    expect(drawing.strokes).toEqual(expected_strokes);
    expect(drawing.strokeOrder).toEqual(expected_stroke_order);
    expect(log.warn.mock.calls.length).toEqual(expected_warning_count);
  }

  // TODO look into decorator syntax for these DataProviders
  dataProvider(test_drawing_data)(testDrawing);
  describe("When ingesting an add_stroke event", () => {
    dataProvider(test_add_stroke_data)(testDrawing);
  });
  describe("When ingesting an append_stroke event", () => {
    dataProvider(test_append_stroke_data)(testDrawing);
  });

  describe("when consuming an initialize event", () => {
    dataProvider(test_initialize_data)(testDrawing);
  });
});
