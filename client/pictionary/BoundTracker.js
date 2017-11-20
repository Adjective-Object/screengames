// @flow
import type { Matrix } from 'transformation-matrix';
import type { DrawingEvent } from './Drawing';
import type { IEventConsumer } from '../common/IEventConsumer';
import type { Point } from './Drawing';

export default class BoundTracker implements IEventConsumer<DrawingEvent> {
  x: number;
  y: number;
  width: number;
  height: number;

  constructor() {
    this.x = 0;
    this.y = 0;
    this.width = 1;
    this.height = 1;
  }

  ingestEvent(event: DrawingEvent): boolean {
    switch (event.type) {
      case 'initialize':
        for (let strokeID in event.initial_state.strokes) {
          let stroke = event.initial_state.strokes[strokeID];
          for (let point of stroke.points) {
            this.__adjustBounding(point);
          }
        }
        return true;
      case 'append_stroke':
      case 'add_stroke':
        this.__adjustBounding(event.point);
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

  castEvent(event: Object): DrawingEvent | null {
    return [
      'initialize',
      'append_stroke',
      'add_stroke',
      'clear_canvas',
    ].includes(event.type)
      ? (event: DrawingEvent)
      : null;
  }

  __adjustBounding(point: Point): void {
    let new_x = Math.min(this.x, point.x);
    let new_y = Math.min(this.y, point.y);
    this.width = Math.max(this.width - (new_x - this.x), point.x - this.x);
    this.height = Math.max(this.height - (new_y - this.y), point.y - this.y);
    this.x = new_x;
    this.y = new_y;
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }
}
