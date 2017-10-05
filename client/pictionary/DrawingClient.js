import guid from "../util/guid";

function distance(p1, p2) {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

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

export default class DrawingClient {
  constructor(props) {
    // Config
    this.distanceThreshold = 10;
    this.timeDistanceThreshold = 2;
    this.timeDifferenceThreshold = 400;

    // Long-lived state
    this.strokes = {};
    this.strokeOrder = [];

    // State for tracking the current stroke
    this.currentStrokeID = null;
    this.lastSampleTime = null;
    this.pendingSample = null;
  }

  startNewStroke(point, time) {
    // TODO color ?
    this.currentStrokeID = guid();
    this.strokeOrder.push(this.currentStrokeID);
    this.strokes[this.currentStrokeID] = {
      points: [point]
    };
    this.pendingSample = point;
    this.lastSampleTime = time;
    return {
      type: "add_stroke",
      stroke_id: this.currentStrokeID,
      point: point
    };
  }

  sampleMovement(point, time) {
    // Bail if not in the middle of recording a new stroke
    if (this.currentStrokeID === null) {
      return null;
    }

    let updated = false;
    let last_point = this.getLastPointOfStroke(this.currentStrokeID);
    let point_distance = distance(point, last_point);
    let timeDifference = time - this.lastSampleTime;
    if (point_distance > this.distanceThreshold) {
      this.__addPointToCurrentStroke(point, time);
      updated = true;
    } else if (
      timeDifference > this.timeDifferenceThreshold &&
      point_distance > this.timeDistanceThreshold
    ) {
      this.__addPointToCurrentStroke(point, time);
      updated = true;
    }
    this.pendingSample = point;

    if (updated) {
      return {
        type: "append_stroke",
        stroke_id: this.currentStrokeID,
        point: point
      };
    }

    return null;
  }

  finishCurrentStroke(point, time) {
    // Bail if not in the middle of recording a new stroke
    if (this.currentStrokeID === null) {
      return null;
    }

    let current_stroke_id = this.currentStrokeID;
    let event = {
      type: "append_stroke",
      stroke_id: current_stroke_id,
      point: this.pendingSample
    };
    this.__addPointToCurrentStroke(this.pendingSample, time);
    this.currentStrokeID = null;
    this.pendingSample = null;
    return event;
  }

  __addPointToCurrentStroke(point, time) {
    this.strokes[this.currentStrokeID].points.push(point);
    this.lastSampleTime = time;
  }

  getLastPointOfStroke(stroke_id) {
    let points = this.strokes[stroke_id].points;
    return points[points.length - 1];
  }
}
