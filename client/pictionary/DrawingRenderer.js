export default class DrawingRenderer {
  renderDrawingToSVG(drawing, svg) {
    svg.innerHTML = "";
    for (let strokeID of drawing.strokeOrder) {
      // Insert a new line as the last child of the svg
      svg.appendChild(this.__renderBaseStroke(drawing.strokes[strokeID]));

      if (strokeID == drawing.currentStrokeID) {
        svg.appendChild(
          this.__renderPendingLine(
            drawing.strokes[strokeID],
            drawing.pendingSample
          )
        );
      }
    }
  }

  __renderBaseStroke(stroke) {
    if (this.__strokeIsDot(stroke)) {
      let circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      circle.setAttribute("cx", stroke.points[0].x);
      circle.setAttribute("cy", stroke.points[0].y);
      circle.setAttribute("r", 1.5);
      circle.setAttribute("style", "fill:black; stroke:black; stroke-width:0");
      return circle;
    }

    let points = stroke.points.map(({ x, y }) => x + "," + y);
    let points_string = points.join(" ");
    let polyline = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "polyline"
    );
    polyline.setAttribute("points", points_string);
    polyline.setAttribute("style", "fill:none; stroke:black; stroke-width:3");
    return polyline;
  }

  __renderPendingLine(stroke, pending_sample) {
    let last_point = stroke.points[stroke.points.length - 1];
    let line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", last_point.x);
    line.setAttribute("y1", last_point.y);
    line.setAttribute("x2", pending_sample.x);
    line.setAttribute("y2", pending_sample.y);
    line.setAttribute("stroke-linecap", "round");
    line.setAttribute("style", "fill:none; stroke:red; stroke-width:3");
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
