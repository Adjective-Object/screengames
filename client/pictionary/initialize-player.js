import Drawing from './Drawing';
import Camera from './Camera';
import PenTool from './tools/PenTool';
import CanvasPanningTool from './tools/CanvasPanningTool';
import DrawingRenderer from './DrawingRenderer';
import SocketEventQueue from '../../util/socket/SocketEventQueue';
import io from 'socket.io-client';
import guid from '../util/guid';
import { inverse as inverseMatrix, applyToPoint } from 'transformation-matrix';
import Cookies from 'js-cookie';

// Convert from DOM space to canvas space based on the current SVG bounding
// rectangle and the viewbox of the rtarget
const transformToCanvasSpace = (camera, draw_target, mouse_event) => {
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
  return applyToPoint(inverseMatrix(camera.transform), {
    x: viewbox_x,
    y: viewbox_y,
  });
};

// TODO make this not bad
let user_id = Cookies.get('user_id');
if (!user_id) {
  console.log('allocate new user id');
  user_id = guid();
  Cookies.set('user_id', user_id);
}
console.log('user_id:', user_id);

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
  socket.on('connect', () => {
    socket.emit('join_room', {
      room_id: 'default',
      user_id: user_id,
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

  function mouseEventToPointSet(mouse_event) {
    return {
      world_space: [transformToCanvasSpace(camera, drawTarget, mouse_event)],
      screen_space: [{ x: mouse_event.clientX, y: mouse_event.clientY }],
    };
  }

  function touchesToPointSet(touches) {
    let world_space_points = Array.from(touches).map(
      transformToCanvasSpace.bind(null, camera, drawTarget),
    );
    let screen_space_points = Array.from(touches).map(touch => ({
      x: touch.clientX,
      y: touch.clientY,
    }));
    return {
      world_space: world_space_points,
      screen_space: screen_space_points,
    };
  }

  // Bind mouse events
  drawTarget.addEventListener('mousedown', e => {
    let time = new Date().getTime();
    let point_set = mouseEventToPointSet(e);
    let tool_event = current_tool.onTouchStart(point_set, time);
    handleToolEvent(tool_event);
  });
  document.addEventListener('mousemove', e => {
    let time = new Date().getTime();
    let point_set = mouseEventToPointSet(e);
    let tool_event = current_tool.onTouchMove(point_set, time);
    handleToolEvent(tool_event);
  });
  document.addEventListener('mouseup', e => {
    let time = new Date().getTime();
    let point_set = mouseEventToPointSet(e);
    let remaining_point_set = { world_space: [], screen_space: [] };
    let tool_event = current_tool.onTouchEnd(
      point_set,
      remaining_point_set,
      time,
    );
    handleToolEvent(tool_event);
  });

  // Bind equivalent handlers for touch events
  drawTarget.addEventListener('touchstart', e => {
    // Prevent double-tap-to-zoom
    e.preventDefault();
    let time = new Date().getTime();
    let point_set = touchesToPointSet(e.touches);
    let tool_event = current_tool.onTouchStart(point_set, time);
    handleToolEvent(tool_event);
  });
  document.addEventListener('touchmove', e => {
    let time = new Date().getTime();
    let point_set = touchesToPointSet(e.touches);
    let tool_event = current_tool.onTouchMove(point_set, time);
    handleToolEvent(tool_event);
  });
  document.addEventListener('touchend', e => {
    let time = new Date().getTime();
    let changed_point_set = touchesToPointSet(e.changedTouches);
    let remaining_point_set = touchesToPointSet(e.touches);
    let tool_event = current_tool.onTouchEnd(
      changed_point_set,
      remaining_point_set,
      time,
    );
    handleToolEvent(tool_event);
  });

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

  const toggleFullscreenButton = document.getElementById('toggle-fullscreen');
  toggleFullscreenButton.addEventListener('click', () => {
    let doc = window.document;
    let docEl = doc.documentElement;

    let requestFullScreen =
      docEl.requestFullscreen ||
      docEl.mozRequestFullScreen ||
      docEl.webkitRequestFullScreen ||
      docEl.msRequestFullscreen;
    let cancelFullScreen =
      doc.exitFullscreen ||
      doc.mozCancelFullScreen ||
      doc.webkitExitFullscreen ||
      doc.msExitFullscreen;

    if (
      !doc.fullscreenElement &&
      !doc.mozFullScreenElement &&
      !doc.webkitFullscreenElement &&
      !doc.msFullscreenElement
    ) {
      toggleFullscreenButton.classList.add('fullscreen');
      requestFullScreen.call(docEl);
    } else {
      cancelFullScreen.call(doc);
      toggleFullscreenButton.classList.remove('fullscreen');
    }
  });

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
