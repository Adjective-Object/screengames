// @flow
import { transform, identity } from 'transformation-matrix';
import type { Matrix } from 'transformation-matrix';
import type { IEventConsumer } from '../common/IEventConsumer';

type CameraTransformEvent = {
  type: 'adjust_transform',
  transform: Matrix,
};

type CameraCenterCanvasEvent = {
  type: 'center_canvas',
};

export type CameraEvent = CameraTransformEvent | CameraCenterCanvasEvent;

export interface ICamera {
  getTransform(): Matrix,
}

export default class Camera implements ICamera, IEventConsumer<CameraEvent> {
  transform: Matrix;

  constructor() {
    this.transform = identity();
  }

  ingestEvent(event: CameraEvent): boolean {
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

  castEvent(event: Object): CameraEvent | null {
    return ['adjust_transform', 'center_canvas'].includes(event.type)
      ? (event: CameraEvent)
      : null;
  }

  getTransform() {
    return this.transform;
  }
}
