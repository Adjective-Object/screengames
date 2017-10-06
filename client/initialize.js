import Drawing from "./pictionary/Drawing";
import PenTool from "./pictionary/tools/PenTool";
import CanvasPanningTool from "./pictionary/tools/CanvasPanningTool";
import DrawingRenderer from "./pictionary/DrawingRenderer";
import SocketEventQueue from "../util/socket/SocketEventQueue";
import io from "socket.io-client";

// Convert from DOM space to canvas space based on the current SVG bounding
// rectangle and the viewbox of the rtarget
const transformToCanvasSpace = (draw_target, mouse_event) => {
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
};

document.addEventListener("DOMContentLoaded", () => {
  let drawing = new Drawing();
  // The pen tool is used in rendering, so keep it in scope
  let pen_tool = new PenTool();
  let tools = {
    pen_tool: pen_tool,
    canvas_panning_tool: new CanvasPanningTool()
  };
  let current_tool = tools["pen_tool"];

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
          renderer.renderDrawingToSVG(drawing, pen_tool, drawTarget);
        }
      }
    }
  });

  // Common handlers for handling a drawing
  function handleToolEvent(drawing_event) {
    if (!drawing_event || !drawing.canIngestEvent(drawing_event)) return;
    if (drawing.ingestEvent(drawing_event)) {
      renderer.renderDrawingToSVG(drawing, pen_tool, drawTarget);
    }
    socket.emit("event", drawing_event);
  }

  // Bind mouse events
  drawTarget.addEventListener("mousedown", e => {
    let time = new Date().getTime();
    let point = transformToCanvasSpace(drawTarget, e);
    let tool_event = current_tool.onTouchStart([point], time);
    handleToolEvent(tool_event);
  });
  document.addEventListener("mousemove", e => {
    let time = new Date().getTime();
    let point = transformToCanvasSpace(drawTarget, e);
    let tool_event = current_tool.onTouchMove([point], time);
    handleToolEvent(tool_event);
  });
  document.addEventListener("mouseup", e => {
    let time = new Date().getTime();
    let point = transformToCanvasSpace(drawTarget, e);
    let tool_event = current_tool.onTouchEnd([point], time);
    handleToolEvent(tool_event);
  });

  // Bind equivalent handlers for touch events
  drawTarget.addEventListener("touchstart", e => {
    // Prevent double-tap-to-zoom
    e.preventDefault();
    let time = new Date().getTime();
    let points = Array.from(e.touches).map(
      transformToCanvasSpace.bind(null, drawTarget)
    );
    let tool_event = current_tool.onTouchStart(points, time);
    handleToolEvent(tool_event);
  });
  document.addEventListener("touchmove", e => {
    let time = new Date().getTime();
    let points = Array.from(e.touches).map(
      transformToCanvasSpace.bind(null, drawTarget)
    );
    let tool_event = current_tool.onTouchMove(points, time);
    handleToolEvent(tool_event);
  });
  document.addEventListener("touchend", e => {
    let time = new Date().getTime();
    let points = Array.from(e.changedTouches).map(
      transformToCanvasSpace.bind(null, drawTarget)
    );
    let tool_event = current_tool.onTouchEnd(points, time);
    handleToolEvent(tool_event);
  });

  Array.from(document.querySelectorAll("[tool-id]")).map(button => {
    button.addEventListener("click", e => {
      console.log("changing tool to", button);
      const tool_id = e.target.getAttribute("tool-id");
      if (!tools.hasOwnProperty(tool_id) || current_tool.isActive()) return;
      current_tool = tools[tool_id];
    });
  });

  let clearCanvasButton = document.getElementById("clear-canvas");
  clearCanvasButton.addEventListener("click", e => {
    let clear_canvas_event = {
      type: "clear_canvas"
    };
    if (drawing.ingestEvent(clear_canvas_event)) {
      renderer.renderDrawingToSVG(drawing, pen_tool, drawTarget);
    }
    socket.emit("event", clear_canvas_event);
  });
});
