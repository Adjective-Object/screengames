import Drawing from './Drawing';
import Camera from './Camera';
import PenTool from './tools/PenTool';
import CanvasPanningTool from './tools/CanvasPanningTool';
import DrawingRenderer from './DrawingRenderer';
import SocketEventQueue from '../../util/socket/SocketEventQueue';
import io from 'socket.io-client';
import guid from '../../util/guid';
import initSession from '../util/negotiate-session';
import transformToCanvasSpace from './transform-to-canvas-space';
import ToggleFullscreenButton from './dom-event-bindings/ToggleFullscreenButton';
import DrawingTarget from './dom-event-bindings/DrawingTarget';

document.addEventListener('DOMContentLoaded', () => {
  let drawing = new Drawing();
  let camera = new Camera();
  let renderer = new DrawingRenderer();
  let drawTarget = document.getElementById('draw-target');
  let eventQueue = new SocketEventQueue();

  // The pen tool is used in rendering, so keep it in scope
  let pen_tool = new PenTool();
  let tools = {
    pen_tool: pen_tool,
    canvas_panning_tool: new CanvasPanningTool(),
  };
  let current_tool = tools['pen_tool'];
  const setActiveTool = tool_elem => {
    // Set the current tool from the tool's id
    const tool_id = tool_elem.getAttribute('tool-id');
    if (!tools.hasOwnProperty(tool_id) || current_tool.isActive()) return;
    current_tool = tools[tool_id];
    // Set the '.selected' class only on the active tool button
    Array.from(document.querySelectorAll('[tool-id]')).map(element => {
      element.classList.remove('selected');
    });
    tool_elem.classList.add('selected');
  };
  setActiveTool(document.querySelector('[tool-id="pen_tool"]'));

  let socket = io();
  initSession(socket).then(({ user_id, nonce }) => {
    socket.emit('join_room', {
      room_id: 'default',
      user_id: user_id,
      nonce: nonce,
    });
  });

  socket.on('event', event => {
    // Queue events
    eventQueue.ingestEvent(event);
    let events = eventQueue.getEvents();

    if (events.length >= 1) {
      // Ingest all applicable events to Drawing
      eventQueue.clearEvents();
      for (let event of events) {
        if (drawing.canIngestEvent(event) && drawing.ingestEvent(event)) {
          renderer.renderDrawingToSVG(camera, drawing, pen_tool, drawTarget);
        }
      }
    }
  });

  // Common handlers for handling a drawing
  function handleToolEvent(tool_event) {
    if (!tool_event) return;
    let should_update = false;
    if (drawing.canIngestEvent(tool_event)) {
      drawing.ingestEvent(tool_event);
      socket.emit('event', tool_event);
      should_update = true;
    }
    if (camera.canIngestEvent(tool_event)) {
      camera.ingestEvent(tool_event);
      should_update = true;
    }
    if (should_update) {
      renderer.renderDrawingToSVG(camera, drawing, pen_tool, drawTarget);
    }
  }

  new DrawingTarget(camera, document, drawTarget)
    .onTouchStart((points, time) =>
      handleToolEvent(current_tool.onTouchStart(points, time)),
    )
    .onTouchMove((points, time) =>
      handleToolEvent(current_tool.onTouchMove(points, time)),
    )
    .onTouchEnd((points, remaining_points, time) =>
      handleToolEvent(current_tool.onTouchEnd(points, remaining_points, time)),
    )
    .bind();

  Array.from(document.querySelectorAll('[tool-id]')).map(button => {
    button.addEventListener('click', e => {
      setActiveTool(e.currentTarget);
    });
  });

  let clearCanvasButton = document.getElementById('clear-canvas');
  clearCanvasButton.addEventListener('click', e => {
    let clear_canvas_event = {
      type: 'clear_canvas',
    };
    if (drawing.ingestEvent(clear_canvas_event)) {
      renderer.renderDrawingToSVG(camera, drawing, pen_tool, drawTarget);
    }
    socket.emit('event', clear_canvas_event);
  });

  let centerCanvasButton = document.getElementById('center-canvas');
  centerCanvasButton.addEventListener('click', e => {
    handleToolEvent({
      type: 'center_canvas',
    });
  });

  new ToggleFullscreenButton(document.documentElement).bind(
    document,
    '.toggle-fullscreen-button',
  );

  const drawingContainer = document.getElementById('drawing-container');
  const resizeDrawingToContainer = resize_event => {
    let container_box = drawingContainer.getBoundingClientRect();
    drawTarget.setAttribute('width', container_box.width);
    drawTarget.setAttribute('height', container_box.height);
    drawTarget.setAttribute(
      'viewBox',
      `0 0 ${container_box.width} ${container_box.height}`,
    );
  };
  resizeDrawingToContainer();
  window.addEventListener('resize', resizeDrawingToContainer);
});
