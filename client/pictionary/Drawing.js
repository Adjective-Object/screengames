/*
interface Point {
    x: float,
    y: float,
}

interface Stroke {
    points: Point[],

}

interface Drawing {
    strokes: {
        [key: string]: Stroke
    }
    strokeOrder: [string];
}
*/

export default class Drawing {
  constructor(props) {
    // Long-lived state
    this.strokes = {};
    this.strokeOrder = [];

    // State for tracking the current stroke
    this.currentStrokeID = null;
    this.lastSampleTime = null;
    this.pendingSample = null;
  }

  __addPointToStroke(stroke_id, point) {
    if (this.strokes.hasOwnProperty(stroke_id)) {
      console.log("append to existing stroke");
      this.strokes[stroke_id].points.push(point);
    } else {
      console.log("got new stroke??");
      this.strokes[stroke_id] = {
        points: [point]
      };
      this.strokeOrder.push(stroke_id);
    }
  }

  ingestEvent(event) {
    switch (event.type) {
      case "add_stroke":
      case "append_stroke":
        console.log(event);
        this.__addPointToStroke(event.stroke_id, event.point);
        return true;
      default:
        console.error("Drawing can't ingest event", event);
        return false;
    }
  }

  canIngestEvent(event) {
    const allowed_events = ["add_stroke", "append_stroke"];
    return allowed_events.indexOf(event.type) !== -1;
  }

  getLastPointOfStroke(stroke_id) {
    let points = this.strokes[stroke_id].points;
    return points[points.length - 1];
  }
}
