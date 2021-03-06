import Drawing from './Drawing';
import Camera from './Camera';
import PenTool from './tools/PenTool';
import CanvasPanningTool from './tools/CanvasPanningTool';
import DrawingRenderer from './DrawingRenderer';
import BoundTracker from './BoundTracker';
import SocketEventQueue from '../../util/socket/SocketEventQueue';
import io from 'socket.io-client';
import guid from '../../util/guid';
import initSession from '../util/negotiate-session';
import transformToCanvasSpace from './transform-to-canvas-space';
import ToggleFullscreenButton from './dom-event-bindings/ToggleFullscreenButton';
import ToggleMenuButton from './dom-event-bindings/ToggleMenuButton';
import DrawingTarget from './dom-event-bindings/DrawingTarget';
import ResizeToContainer from './dom-event-bindings/ResizeToContainer';
import ToolMenu from './dom-event-bindings/ToolMenu';
import EventDispatcher from './EventDispatcher';
import transformFromCameraBounds from '../util/transform-from-camera-bounds';
import { toString as transformToString } from 'transformation-matrix';

document.addEventListener('DOMContentLoaded', () => {
  let boundTracker = new BoundTracker();
  let drawing = new Drawing();
  let camera = new Camera();
  // TODO use pictionay data validation here
  let renderer = new DrawingRenderer();
  let drawTarget = document.getElementById('draw-target');
  let eventQueue = new SocketEventQueue();

  let toggleMenu = new ToggleMenuButton(
    document.getElementById('sidebar-menu'),
    document.getElementById('toggle-menu'),
    document.getElementById('sidebar-menu-overlay'),
  ).bind();

  // The pen tool is used in rendering, so keep it in scope
  let pen_tool = new PenTool();
  let tools = {
    pen_tool: pen_tool,
    canvas_panning_tool: new CanvasPanningTool(),
  };
  current_tool = undefined;
  new ToolMenu(document.documentElement, Object.keys(tools))
    .onSelectTool(tool_id => {
      // Only allow a tool to be selected if the current tool is not 'active'
      if (current_tool === undefined || current_tool === null) {
        return true;
      }
      if (current_tool.isActive()) {
        return false;
      }
      current_tool = tools[tool_id];
      return true;
    })
    .setActiveTool('pen_tool')
    .bind(document.documentElement);

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

  let drawingEventDispatcher = new EventDispatcher()
    .addConsumer(drawing)
    .addConsumer(camera)
    .addConsumer(boundTracker)
    .addUpdateTrigger(() => {
      renderer.renderDrawingToSVG(camera, drawing, pen_tool, drawTarget);
    });

  socket.on('event', event => {
    // Queue incoming events and dispatch them to consumers if any exist
    eventQueue.ingestEvent(event);
    let pending_events = eventQueue.getEvents();
    if (pending_events.length == 0) return;
    drawingEventDispatcher.consumeEvents(pending_events);
    eventQueue.clearEvents();
  });

  // Common handlers for handling a drawing
  function handleToolEvent(tool_event) {
    if (!tool_event) return;
    drawingEventDispatcher.consumeEvent(tool_event);
    let event = drawing.castEvent(tool_event);
    if (event) {
      socket.emit('event', tool_event);
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

  let clearCanvasButton = document.getElementById('clear-canvas');
  clearCanvasButton.addEventListener('click', e => {
    toggleMenu.close();
    let clear_canvas_event = {
      type: 'clear_canvas',
    };
    handleToolEvent(clear_canvas_event);
    socket.emit('event', clear_canvas_event);
  });

  let centerCanvasButton = document.getElementById('center-canvas');
  centerCanvasButton.addEventListener('click', e => {
    toggleMenu.close();
    handleToolEvent({
      type: 'replace_transform',
      transform: transformFromCameraBounds(
        boundTracker.getBounds(),
        0.2,
        drawTarget,
      ),
    });
  });

  let undoButton = document.getElementById('undo-stroke');
  undoButton.addEventListener('click', e => {
    let tool_event = pen_tool.popLastStroke();
    if (tool_event !== null) {
      handleToolEvent(tool_event);
    }
  });

  Array.from(document.querySelectorAll('[tool-id]')).map(button => {
    button.addEventListener('click', e => {
      setActiveTool(e.currentTarget);
    });
  });

  let saveCanvasButton = document.getElementById('save-canvas');
  saveCanvasButton.addEventListener('mousedown', e => {
    let original_svg_string = drawTarget.outerHTML;
    let all_canvas_content_transform = transformFromCameraBounds(
      boundTracker.getBounds(),
      0.2,
      drawTarget,
    );
    // Avoid changing the bounds on the rendered svg by doing this off dom
    let host_section = document.createElement('section');
    host_section.innerHTML = original_svg_string;
    let transform_group = host_section.querySelector('g');
    transform_group.setAttribute(
      'transform',
      transformToString(all_canvas_content_transform),
    );
    let transformed_svg_string = host_section.innerHTML;

    // Build the output file
    let svg_file = new File([transformed_svg_string], 'canvas.svg');
    let svg_url = URL.createObjectURL(svg_file);
    saveCanvasButton.href = svg_url;

    // Make the download name something else
    let now = new Date();
    saveCanvasButton.download =
      `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${guid()}` +
      `-canvas.svg`;
  });

  saveCanvasButton.addEventListener('click', e => {
    toggleMenu.close();
  });

  new ToggleFullscreenButton(document.documentElement).bind(
    document,
    '.toggle-fullscreen-button',
  );

  const drawingContainer = document.getElementById('drawing-container');
  new ResizeToContainer(drawingContainer, drawTarget).resize().bind(window);
});
