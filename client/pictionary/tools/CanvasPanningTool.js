import log from "../../../util/log";
import distance from "../../util/distance";
import {
  transform,
  translate,
  scale,
  inverse,
  applyToPoint
} from "transformation-matrix";

export default class CanvasPanningTool {
  constructor() {
    this.trackedPoints = null;
  }

  onTouchStart(points, time) {
    if (this.trackedPoints === null) {
      this.trackedPoints = points.length > 1 ? points.splice(0, 2) : points;
    }
  }

  onTouchMove(points, time) {
    if (this.trackedPoints == null) return null;
    // Track up to 2 points
    const new_points = points.length > 1 ? points.splice(0, 2) : points;

    // If the tracked points length is not equal to the new points
    // length, then we want to switch from panning to panzooming
    if (new_points.length !== this.trackedPoints.length) {
      this.trackedPoints = new_points;
      return null;
    }

    // 1 point is used for panning
    if (new_points.length == 1) {
      let transform_event = this.__pan(this.trackedPoints[0], new_points[0]);
      this.trackedPoints = this.__applyEventToPoints(
        transform_event,
        new_points
      );
      return transform_event;
    }

    // 2 point is used for panzooming
    if (new_points.length == 2) {
      let transform_event = this.__panzoom(this.trackedPoints, new_points);
      this.trackedPoints = this.__applyEventToPoints(
        transform_event,
        new_points
      );
      return transform_event;
    }
  }

  onTouchEnd(points, remaining_points, time) {
    if (remaining_points.length === 0) {
      this.trackedPoints = null;
    }
  }

  __pan(old_point, new_point) {
    let translation_x = old_point.x - new_point.x;
    let translation_y = old_point.y - new_point.y;
    return {
      type: "adjust_transform",
      transform: translate(-translation_x, -translation_y)
    };
  }

  __panzoom(old_points, new_points) {
    let old_midpoint = {
      x: (old_points[0].x + old_points[1].x) / 2,
      y: (old_points[0].y + old_points[1].y) / 2
    };
    let new_midpoint = {
      x: (new_points[0].x + new_points[1].x) / 2,
      y: (new_points[0].y + new_points[1].y) / 2
    };
    let translation_x = old_midpoint.x - new_midpoint.x;
    let translation_y = old_midpoint.y - new_midpoint.y;
    let old_dist = distance(old_points[0], old_points[1]);
    let new_dist = distance(new_points[0], new_points[1]);
    let scale_ratio = new_dist / old_dist;

    // cale about the destination
    let transform_matrix = transform(
      translate(new_midpoint.x, new_midpoint.y),
      scale(scale_ratio, scale_ratio),
      translate(-new_midpoint.x, -new_midpoint.y),
      translate(-translation_x, -translation_y)
    );

    return {
      type: "adjust_transform",
      transform: transform_matrix
    };
  }

  isActive() {
    return this.trackedPoints !== null;
  }

  __applyEventToPoints(transform_event, points) {
    return points.map(point =>
      applyToPoint(inverse(transform_event.transform), point)
    );
  }
}
