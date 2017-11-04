import Drawing from './Drawing';
import Camera from './Camera';
import PenTool from './tools/PenTool';
import CanvasPanningTool from './tools/CanvasPanningTool';
import DrawingRenderer from './DrawingRenderer';
import SocketEventQueue from '../../util/socket/SocketEventQueue';
import io from 'socket.io-client';
import guid from '../../util/guid';
import { inverse as inverseMatrix, applyToPoint } from 'transformation-matrix';
import initSession from '../util/negotiate-session';
import ResizeToContainer from './dom-event-bindings/ResizeToContainer';
import ToggleFullscreenButton from './dom-event-bindings/ToggleFullscreenButton';
import EventDispatcher from './EventDispatcher';

document.addEventListener('DOMContentLoaded', () => {
  let drawing = new Drawing();
  let camera = new Camera();
  let renderer = new DrawingRenderer();
  let drawTarget = document.getElementById('draw-target');
  let eventQueue = new SocketEventQueue();

  let socket = io();
  initSession(socket).then(({ user_id, nonce }) => {
    socket.emit('join_room', {
      room_id: 'default',
      user_id: user_id,
      nonce: nonce,
    });
  });

  let eventDispatcher = new EventDispatcher()
    .addConsumer(drawing)
    .addConsumer(camera)
    .addUpdateTrigger(() => {
      renderer.renderDrawingToSVG(camera, drawing, null, drawTarget);
    });

  socket.on('event', event => {
    // Queue incoming events and dispatch them to consumers if any exist
    eventQueue.ingestEvent(event);
    let pending_events = eventQueue.getEvents();
    if (pending_events.length == 0) return;
    eventDispatcher.consumeEvents(pending_events);
    eventQueue.clearEvents();
  });

  new ToggleFullscreenButton(document.documentElement).bind(
    document,
    '.toggle-fullscreen-button',
  );

  const drawingContainer = document.getElementById('drawing-container');
  new ResizeToContainer(drawingContainer, drawTarget).resize().bind(window);
});
