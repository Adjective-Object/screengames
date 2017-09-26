import Drawing from "./pictionary/Drawing.js";
import DrawingClient from "./pictionary/DrawingClient.js";
import DrawingRenderer from "./pictionary/DrawingRenderer.js";
import io from "socket.io-client";

document.addEventListener("DOMContentLoaded", () => {
  let drawing = new Drawing();
  let drawing_client = new DrawingClient();
  let renderer = new DrawingRenderer();
  let drawTarget = document.getElementById("draw-target");

  let socket = io();
  socket.on("connect", () => {
    socket.emit("join_room", "default");
  });

  socket.on("event", event => {
    if (drawing.canIngestEvent(event) && drawing.ingestEvent(event)) {
      console.log("re-render", drawing);

      renderer.renderDrawingToSVG(drawing, drawing_client, drawTarget);
    }
  });

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
    let [should_re_render, drawing_event] = method(
      transformToCanvasSpace(mouse_event),
      new Date().getTime()
    );
    if (drawing_event !== null) {
      drawing.ingestEvent(drawing_event);
      socket.emit("event", drawing_event);
    }
    if (should_re_render) {
      renderer.renderDrawingToSVG(drawing, drawing_client, drawTarget);
    }
  }

  // Bind mouse events
  drawTarget.addEventListener("mousedown", e =>
    handleMouseChange(drawing_client.startNewStroke.bind(drawing_client), e)
  );
  drawTarget.addEventListener("mousemove", e =>
    handleMouseChange(drawing_client.sampleMovement.bind(drawing_client), e)
  );
  drawTarget.addEventListener("mouseup", e =>
    handleMouseChange(
      drawing_client.finishCurrentStroke.bind(drawing_client),
      e
    )
  );

  // Bind equivalent handlers for touch events
  drawTarget.addEventListener("touchstart", e => {
    handleMouseChange(
      drawing_client.startNewStroke.bind(drawing_client),
      e.changedTouches[0]
    );
    // Prevent double-tap-to-zoom
    e.preventDefault();
  });
  document.addEventListener("touchmove", e => {
    handleMouseChange(
      drawing_client.sampleMovement.bind(drawing_client),
      e.changedTouches[0]
    );
    // Prevent pinch zooming
  });
  document.addEventListener("touchend", e => {
    handleMouseChange(
      drawing_client.finishCurrentStroke.bind(drawing_client),
      e.changedTouches[0]
    );
  });
});
