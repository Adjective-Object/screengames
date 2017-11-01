import Drawing from './Drawing';
import Camera from './Camera';
import PenTool from './tools/PenTool';
import CanvasPanningTool from './tools/CanvasPanningTool';
import DrawingRenderer from './DrawingRenderer';
import SocketEventQueue from '../../util/socket/SocketEventQueue';
import io from 'socket.io-client';
import guid from '../util/guid';
import { inverse as inverseMatrix, applyToPoint } from 'transformation-matrix';

document.addEventListener('DOMContentLoaded', () => {
  let drawing = new Drawing();
  let camera = new Camera();
  let renderer = new DrawingRenderer();
  let drawTarget = document.getElementById('draw-target');
  let eventQueue = new SocketEventQueue();

  let socket = io();
  socket.on('connect', () => {
    socket.emit('join_room', {
      room_id: 'default',
      user_id: guid(),
      board: true,
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
          renderer.renderDrawingToSVG(camera, drawing, null, drawTarget);
        }
      }
    }
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

  // Resize the canvas to the whenever it is reshaped
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
