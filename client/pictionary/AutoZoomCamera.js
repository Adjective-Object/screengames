// @flow
import { transform, identity, translate, scale } from 'transformation-matrix';
import transformFromCameraBounds from '../util/transform-from-camera-bounds';
import PointSpace from './PointSpace';
import BoundTracker from './BoundTracker';
import type { Matrix } from 'transformation-matrix';
import type { Event, EventConsumer } from './EventConsumer';
import type { Point } from './Drawing';
import type { ICamera } from './Camera';

export default class AutoZoomCamera implements ICamera, EventConsumer {
  drawTarget: HTMLSvgElement;
  margin: number;
  boundTracker: BoundTracker;

  constructor(margin: number, draw_target: HTMLSvgElement) {
    this.margin = margin;
    this.drawTarget = draw_target;
    this.boundTracker = new BoundTracker();
  }

  ingestEvent(event: Event): boolean {
    return this.boundTracker.ingestEvent(event);
  }

  canIngestEvent(event: Event) {
    return this.boundTracker.canIngestEvent(event);
  }

  getTransform() {
    return transformFromCameraBounds(
      this.boundTracker.getBounds(),
      this.margin,
      this.drawTarget,
    );
  }
}
