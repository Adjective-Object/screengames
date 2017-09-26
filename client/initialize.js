import Drawing from "./pictionary/Drawing.js";
import DrawingRenderer from "./pictionary/DrawingRenderer.js";
import io from "socket.io-client";

document.addEventListener("DOMContentLoaded", () => {
  let socket = io();
  socket.on('connect', () => {
    socket.emit('join_room', 'default');
  })

  socket.on('event', (event) => {
    console.log('got event', event);
  })

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
  function handleMouseChange(method, mouse_event) {
    let [drawingWasUpdated, event] = method(
      transformToCanvasSpace(mouse_event),
      new Date().getTime()
    );
    if (event) {
      socket.emit('event', event);
    }
    if (drawingWasUpdated) {
      renderer.renderDrawingToSVG(drawing, drawTarget);
    }
  }

  // Bind mouse events
  drawTarget.addEventListener("mousedown",
    (e) => handleMouseChange(
      drawing.startNewStroke.bind(drawing), e
    )
  );
  drawTarget.addEventListener("mousemove",
    (e) => handleMouseChange(
      drawing.sampleMovement.bind(drawing), e
    )
  );
  drawTarget.addEventListener("mouseup",
    (e) => handleMouseChange(
      drawing.finishCurrentStroke.bind(drawing), e
    )
  );

  // Bind equivalent handlers for touch events
  drawTarget.addEventListener("touchstart", e => {
    handleMouseChange(
      drawing.startNewStroke.bind(drawing),
      e.changedTouches[0],
    );
    // Prevent double-tap-to-zoom
    e.preventDefault();
  });
  document.addEventListener("touchmove", e => {
    handleMouseChange(
      drawing.sampleMovement.bind(drawing),
      e.changedTouches[0],
    );
    // Prevent pinch zooming
  });
  document.addEventListener("touchend", e => {
    handleMouseChange(
      drawing.finishCurrentStroke.bind(drawing),
      e.changedTouches[0],
    );
  });
});
