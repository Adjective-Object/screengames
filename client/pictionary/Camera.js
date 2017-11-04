// @flow
import { transform, identity } from 'transformation-matrix';
import type { Matrix } from 'transformation-matrix';
import type { Event, EventConsumer } from './EventConsumer';

type CameraTransformEvent = {
  type: 'adjust_transform',
  transform: Matrix,
};

type CameraCenterCanvasEvent = {
  type: 'center_canvas',
};

export type Events = CameraTransformEvent | CameraCenterCanvasEvent;

export default class Camera {
  transform: Matrix;

  constructor() {
    this.transform = identity();
  }

  ingestEvent(event: Event): boolean {
    switch (event.type) {
      case 'adjust_transform':
        this.transform = transform(this.transform, event.transform);
        return true;
      case 'center_canvas':
        this.transform = identity();
        return true;
      default:
        return false;
    }
  }

  canIngestEvent(event: Event) {
    const allowed_events = ['adjust_transform', 'center_canvas'];
    return allowed_events.indexOf(event.type) !== -1;
  }
}
