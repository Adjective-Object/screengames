import Drawing from "./pictionary/Drawing.js";
import DrawingRenderer from "./pictionary/DrawingRenderer.js";
import io from "socket.io-client";

document.addEventListener("DOMContentLoaded", () => {
  let socket = io(window.location.origin);

  let drawing = new Drawing();
  let renderer = new DrawingRenderer();
  let drawTarget = document.getElementById("draw-target");

  // Convert from DOM space to canvas space based on the current SVG bounding
  // rectangle and the viewbox of the rtarget
  function transformToCanvasSpace(mouse_event) {
    let boundingRect = drawTarget.getBoundingClientRect();
    // Get location of the mouse event in SVG space
    let viewbox_x =
      (mouse_event.clientX - boundingRect.left) /
        boundingRect.width *
        drawTarget.viewBox.baseVal.width +
      drawTarget.viewBox.baseVal.x;
    let viewbox_y =
      (mouse_event.clientY - boundingRect.top) /
        boundingRect.height *
        drawTarget.viewBox.baseVal.height +
      drawTarget.viewBox.baseVal.y;
    return {
      x: viewbox_x,
      y: viewbox_y
    };
  }

  // Common handlers for handling a drawing
  function handleMouseDown(mouse_down_event) {
    let drawingWasUpdated = drawing.startNewStroke(
      transformToCanvasSpace(mouse_down_event),
      new Date().getTime()
    );
    if (drawingWasUpdated) {
      renderer.renderDrawingToSVG(drawing, drawTarget);
    }
  }

  function handleMouseMove(mouse_move_event) {
    let drawingWasUpdated = drawing.sampleMovement(
      transformToCanvasSpace(mouse_move_event),
      new Date().getTime()
    );
    if (drawingWasUpdated) {
      renderer.renderDrawingToSVG(drawing, drawTarget);
    }
  }

  function handleMouseUp(mouse_up_event) {
    let drawingWasUpdated = drawing.finishCurrentStroke(
      transformToCanvasSpace(mouse_up_event),
      new Date().getTime()
    );
    if (drawingWasUpdated) {
      renderer.renderDrawingToSVG(drawing, drawTarget);
    }
  }

  // Bind mouse events
  drawTarget.addEventListener("mousedown", handleMouseDown);
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);

  // Bind equivalent handlers for touch events
  drawTarget.addEventListener("touchstart", e => {
    handleMouseDown(e.changedTouches[0]);
    // Prevent double-tap-to-zoom
    e.preventDefault();
  });
  document.addEventListener("touchmove", e => {
    handleMouseMove(e.changedTouches[0]);
    // Prevent pinch zooming
    e.preventDefault();
  });
  document.addEventListener("touchend", e => {
    handleMouseUp(e.changedTouches[0]);
  });
});
