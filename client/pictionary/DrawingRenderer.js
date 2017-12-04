import { toString as transformToString } from 'transformation-matrix';
import log from '../../util/log';
import logRuntime from '../../util/log-runtime';

export default class DrawingRenderer {
  @logRuntime('drawing-time')
  renderDrawingToSVG(
    camera,
    drawing,
    drawing_client,
    svg,
    ids_to_update = null,
  ) {
    let group = svg.querySelector('g');
    group.setAttribute('transform', transformToString(camera.getTransform()));
    let stroke_id_set = new Set(drawing.strokeOrder);
    // Update existing strokes
    for (let existing_stroke of Array.from(group.children)) {
      // Remove the stroke if it is the pending line
      if (existing_stroke.getAttribute('id') === 'pending-line') {
        existing_stroke.remove();
        continue;
      }

      let stroke_id = existing_stroke.getAttribute('data-stroke-id');
      if (stroke_id === null) {
        log.warn({
          type: 'stroke_no_id',
          message: 'stroke on DOM has no data-stroke-id attribute',
        });
        existing_stroke.remove();
        continue;
      }

      // Remove the stroke if it was deleted from the source data
      let stroke_data = drawing.strokes[stroke_id];
      if (stroke_data === undefined) {
        existing_stroke.remove();
        continue;
      }

      stroke_id_set.delete(stroke_id);

      // Update the stroke if it needs to be replaced
      if (this.__shouldUpdateStroke(existing_stroke, stroke_data)) {
        let new_stroke = this.__renderBaseStroke(stroke_data);
        group.insertBefore(new_stroke, existing_stroke);
        // console.log(group, existing_stroke)
        existing_stroke.remove();
      }

      // render the pending line if this is the right line
      if (
        drawing_client !== null &&
        stroke_id == drawing_client.currentStrokeID
      ) {
        group.appendChild(
          this.__renderPendingLine(
            drawing.strokes[stroke_id],
            drawing_client.pendingSample,
          ),
        );
      }
    }

    // Add new strokes
    for (let new_stroke_id of stroke_id_set) {
      let stroke_data = drawing.strokes[new_stroke_id];
      group.appendChild(
        this.__renderBaseStroke(drawing.strokes[new_stroke_id]),
      );
    }
  }

  __shouldUpdateStroke(existing_stroke, stroke_data) {
    switch (existing_stroke.tagName) {
      case 'circle':
        return stroke_data.points.length != 1;
      case 'line':
        return stroke_data.points.lenth != 2;
      case 'path':
        let points_in_existing_stroke =
          existing_stroke.getAttribute('d').match(/L|M/g) || [];
        return points_in_existing_stroke.length !== stroke_data.points.length;
      default:
        return true;
    }
  }

  __renderBaseStroke(stroke) {
    if (this.__strokeIsDot(stroke)) {
      let circle = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle',
      );
      circle.setAttribute('cx', stroke.points[0].x);
      circle.setAttribute('cy', stroke.points[0].y);
      circle.setAttribute('r', 1.5);
      circle.setAttribute('style', 'fill:black; stroke:black; stroke-width:0');
      circle.setAttribute('data-stroke-id', stroke.id);
      return circle;
    }

    let first_point = `M ${stroke.points[0].x} ${stroke.points[0].y}`;
    let tail_points = stroke.points.slice(1).map(({ x, y }) => `L ${x} ${y}`);
    let points = [first_point].concat(tail_points);
    let points_string = points.join(' ');
    let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', points_string);
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('style', 'fill:none; stroke:black; stroke-width:3');
    path.setAttribute('data-stroke-id', stroke.id);
    return path;
  }

  __renderPendingLine(stroke, pending_sample) {
    let last_point = stroke.points[stroke.points.length - 1];
    let line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', last_point.x);
    line.setAttribute('y1', last_point.y);
    line.setAttribute('x2', pending_sample.x);
    line.setAttribute('y2', pending_sample.y);
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('style', 'fill:none; stroke:red; stroke-width:3');
    line.setAttribute('id', 'pending-line');
    return line;
  }

  // Determine if a stroke is just a single dot
  __strokeIsDot(stroke) {
    return (
      stroke.points.length == 2 &&
      stroke.points[0].x == stroke.points[1].x &&
      stroke.points[0].y == stroke.points[1].y
    );
  }
}
