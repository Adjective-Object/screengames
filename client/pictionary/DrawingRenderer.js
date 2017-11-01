import { toString as transformToString } from 'transformation-matrix';

export default class DrawingRenderer {
  renderDrawingToSVG(camera, drawing, drawing_client, svg) {
    let group = svg.querySelector('g');
    group.setAttribute('transform', transformToString(camera.transform));
    group.innerHTML = '';
    for (let strokeID of drawing.strokeOrder) {
      // Insert a new line as the last child of the svg
      group.appendChild(this.__renderBaseStroke(drawing.strokes[strokeID]));

      if (
        drawing_client !== null &&
        strokeID == drawing_client.currentStrokeID
      ) {
        group.appendChild(
          this.__renderPendingLine(
            drawing.strokes[strokeID],
            drawing_client.pendingSample,
          ),
        );
      }
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
