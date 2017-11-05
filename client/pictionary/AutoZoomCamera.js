// @flow
import { transform, identity, translate, scale } from 'transformation-matrix';
import PointSpace from './PointSpace';
import type { Matrix } from 'transformation-matrix';
import type { Event, EventConsumer } from './EventConsumer';
import type { Point } from './Drawing';
import type { ICamera } from './Camera';

type CameraTransformEvent = {
  type: 'adjust_transform',
  transform: Matrix,
};

type CameraCenterCanvasEvent = {
  type: 'center_canvas',
};

export type Events = CameraTransformEvent | CameraCenterCanvasEvent;

export default class AutoZoomCamera implements ICamera, EventConsumer {
  drawTarget: HTMLSvgElement;
  margin: number;
  x: number;
  y: number;
  width: number;
  height: number;

  constructor(margin: number, draw_target: HTMLSvgElement) {
    this.margin = margin;
    this.x = 0;
    this.y = 0;
    this.width = 1;
    this.height = 1;
    this.drawTarget = draw_target;
  }

  ingestEvent(event: Event): boolean {
    switch (event.type) {
      case 'initialize':
        for (let strokeID in event.initial_state.strokes) {
          let stroke = event.initial_state.strokes[strokeID];
          for (let point of stroke.points) {
            this.adjustBounding(point);
          }
        }
        return true;
      case 'append_stroke':
      case 'add_stroke':
        this.adjustBounding(event.point);
        return true;
      case 'clear_canvas':
        this.x = 0;
        this.y = 0;
        this.width = 1;
        this.height = 1;
        return true;
      default:
        return false;
    }
  }

  canIngestEvent(event: Event) {
    const allowed_events = [
      'initialize',
      'append_stroke',
      'add_stroke',
      'clear_canvas',
    ];
    return allowed_events.indexOf(event.type) !== -1;
  }

  getTransform(): Matrix {
    let scale_ratio = Math.min(
      this.drawTarget.viewBox.baseVal.width / this.width,
      this.drawTarget.viewBox.baseVal.height / this.height,
    );
    let margin_ratio = 1 + this.margin * 2;
    let trans = transform(
      scale(scale_ratio, scale_ratio),
      translate(-this.x, -this.y),
      scale(1 / margin_ratio, 1 / margin_ratio),
      translate(
        this.margin * this.drawTarget.viewBox.baseVal.width / 2,
        this.margin * this.drawTarget.viewBox.baseVal.height / 2,
      ),
    );
    return trans;
  }

  adjustBounding(point: Point): void {
    let new_x = Math.min(this.x, point.x);
    let new_y = Math.min(this.y, point.y);
    this.width = Math.max(this.width - (new_x - this.x), point.x - this.x);
    this.height = Math.max(this.height - (new_y - this.y), point.y - this.y);
    this.x = new_x;
    this.y = new_y;
  }
}
