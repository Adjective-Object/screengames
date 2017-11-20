// @flow
import { transform, identity, translate, scale } from 'transformation-matrix';
import transformFromCameraBounds from '../util/transform-from-camera-bounds';
import PointSpace from './PointSpace';
import BoundTracker from './BoundTracker';
import type { Matrix } from 'transformation-matrix';
import type { IEventConsumer } from '../common/IEventConsumer';
import type { Point } from './Drawing';
import type { ICamera } from './Camera';
import type { DrawingEvent } from './Drawing';

export default class AutoZoomCamera
  implements ICamera, IEventConsumer<DrawingEvent> {
  drawTarget: HTMLSvgElement;
  margin: number;
  boundTracker: BoundTracker;

  constructor(margin: number, draw_target: HTMLSvgElement) {
    this.margin = margin;
    this.drawTarget = draw_target;
    this.boundTracker = new BoundTracker();
  }

  ingestEvent(event: DrawingEvent): boolean {
    return this.boundTracker.ingestEvent(event);
  }

  castEvent(event: Object): DrawingEvent | null {
    return this.boundTracker.castEvent(event);
  }

  getTransform() {
    return transformFromCameraBounds(
      this.boundTracker.getBounds(),
      this.margin,
      this.drawTarget,
    );
  }
}
