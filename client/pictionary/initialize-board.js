// @flow
import Drawing from './Drawing';
import AutoZoomCamera from './AutoZoomCamera';
import PenTool from './tools/PenTool';
import CanvasPanningTool from './tools/CanvasPanningTool';
import DrawingRenderer from './DrawingRenderer';
import SocketEventQueue from '../../util/socket/SocketEventQueue';
import io from 'socket.io-client';
import initSession from '../util/negotiate-session';
import ResizeToContainer from './dom-event-bindings/ResizeToContainer';
import ToggleFullscreenButton from './dom-event-bindings/ToggleFullscreenButton';
import EventDispatcher from './EventDispatcher';
import log from '../../util/log';
import CodedError from '../../util/CodedError';

document.addEventListener('DOMContentLoaded', () => {
  let drawTarget = document.getElementById('draw-target');
  if (drawTarget === null) {
    throw new CodedError({
      type: 'drawing-target-null',
      message: `got null for selector #draw-target, can't continue.`,
    });
  }

  let drawing = new Drawing();
  let renderer = new DrawingRenderer();
  let eventQueue = new SocketEventQueue();
  // $FlowFixMe HTMLSvgElement not officially defined. Can't check at runtime
  let camera = new AutoZoomCamera(0.05, drawTarget);

  let socket = io();
  initSession(socket, false).then(({ user_id, nonce }) => {
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

  if (document.documentElement !== null) {
    new ToggleFullscreenButton(document.documentElement).bind(
      document,
      '.toggle-fullscreen-button',
    );
  } else {
    log.warn({
      type: 'document-element-null',
      message: 'document.documentElement is null. Fullscreen will be busted',
    });
  }

  const drawingContainer = document.getElementById('drawing-container');
  if (drawingContainer !== null) {
    // $FlowFixMe HTMLSvgElement not officially defined. Can't check at runtime
    new ResizeToContainer(drawingContainer, drawTarget).resize().bind(window);
  } else {
    log.warn({
      type: 'drawing-container-null',
      message: 'cannot find element #drawing-container in dom',
    });
  }
});
