import Drawing from "./pictionary/Drawing";
import DrawingClient from "./pictionary/DrawingClient";
import DrawingRenderer from "./pictionary/DrawingRenderer";
import SocketEventQueue from "../util/socket/SocketEventQueue";
import io from "socket.io-client";

// Convert from DOM space to canvas space based on the current SVG bounding
// rectangle and the viewbox of the rtarget
function transformToCanvasSpace(draw_target, mouse_event) {
  let boundingRect = draw_target.getBoundingClientRect();
  // Get location of the mouse event in SVG space
  let viewbox_x =
    (mouse_event.clientX - boundingRect.left) /
      boundingRect.width *
      draw_target.viewBox.baseVal.width +
    draw_target.viewBox.baseVal.x;
  let viewbox_y =
    (mouse_event.clientY - boundingRect.top) /
      boundingRect.height *
      draw_target.viewBox.baseVal.height +
    draw_target.viewBox.baseVal.y;
  return {
    x: viewbox_x,
    y: viewbox_y
  };
}

document.addEventListener("DOMContentLoaded", () => {
  let drawing = new Drawing();
  let drawing_client = new DrawingClient();
  let renderer = new DrawingRenderer();
  let drawTarget = document.getElementById("draw-target");
  let eventQueue = new SocketEventQueue();

  let socket = io();
  socket.on("connect", () => {
    socket.emit("join_room", "default");
  });

  socket.on("event", event => {
    // Queue events
    eventQueue.ingestEvent(event);
    let events = eventQueue.getEvents();

    if (events.length >= 1) {
      // Ingest all applicable events to Drawing
      eventQueue.clearEvents();
      for (let event of events) {
        if (drawing.canIngestEvent(event) && drawing.ingestEvent(event)) {
          renderer.renderDrawingToSVG(drawing, drawing_client, drawTarget);
        }
      }
    }
  });

  // Common handlers for handling a drawing
  function handleMouseChange(method, mouse_event) {
    let drawing_event = method(
      transformToCanvasSpace(drawTarget, mouse_event),
      new Date().getTime()
    );
    if (drawing_event === null) return;
    if (drawing.ingestEvent(drawing_event)) {
      renderer.renderDrawingToSVG(drawing, drawing_client, drawTarget);
    }
    socket.emit("event", drawing_event);
  }

  // Bind mouse events
  drawTarget.addEventListener("mousedown", e =>
    handleMouseChange(drawing_client.startNewStroke.bind(drawing_client), e)
  );
  document.addEventListener("mousemove", e =>
    handleMouseChange(drawing_client.sampleMovement.bind(drawing_client), e)
  );
  document.addEventListener("mouseup", e =>
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
