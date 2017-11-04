// @flow
import Camera from '../Camera';
import PointSpace from '../PointSpace';
import type { PointSet } from '../PointSpace';
import log from '../../../util/log';
import CodedError from '../../../util/CodedError';

type PointConsumerFunction = (PointSet, number) => void;
type PointEndConsumerFunction = (PointSet, PointSet, number) => void;

/**
 * Converts mouse and touch events from the given DOM elements and into a
 * the canvas space of the drawing document, passing them off to provided
 * handlers
 **/
export default class DrawingTarget {
  mouseMoveTarget: HTMLElement;
  clickStartTarget: HTMLElement;
  pointSpace: PointSpace;
  _onTouchStart: PointConsumerFunction | null;
  _onTouchMove: PointConsumerFunction | null;
  _onTouchEnd: PointEndConsumerFunction | null;

  constructor(
    camera: Camera,
    mouse_move_target: HTMLElement,
    click_start_target: HTMLSvgElement,
  ) {
    this.mouseMoveTarget = mouse_move_target;
    this.clickStartTarget = click_start_target;
    this.pointSpace = new PointSpace(camera, this.clickStartTarget);
    this._onTouchStart = null;
    this._onTouchMove = null;
    this._onTouchEnd = null;
  }

  onTouchStart(fn: PointConsumerFunction): DrawingTarget {
    this._onTouchStart = fn;
    return this;
  }

  onTouchMove(fn: PointConsumerFunction): DrawingTarget {
    this._onTouchMove = fn;
    return this;
  }

  onTouchEnd(fn: PointEndConsumerFunction): DrawingTarget {
    this._onTouchEnd = fn;
    return this;
  }

  _unpackHandler<T>(eventName: string, handler: T | null): T {
    if (handler === null) {
      throw new CodedError({
        type: 'mousedown_before_handler',
        message: 'mousedown reveived before handler was registered',
      });
    }
    return handler;
  }

  bind() {
    // Bind mouse events
    this.clickStartTarget.addEventListener('mousedown', (e: MouseEvent) => {
      let onTouchStart = this._unpackHandler('mousedown', this._onTouchStart);
      let time = new Date().getTime();
      let point_set = this.pointSpace.mouseEventToPointSet(e);
      onTouchStart(point_set, time);
    });
    this.mouseMoveTarget.addEventListener('mousemove', (e: MouseEvent) => {
      let onTouchMove = this._unpackHandler('mousemove', this._onTouchMove);
      let time = new Date().getTime();
      let point_set = this.pointSpace.mouseEventToPointSet(e);
      onTouchMove(point_set, time);
    });
    this.mouseMoveTarget.addEventListener('mouseup', (e: MouseEvent) => {
      let onTouchEnd = this._unpackHandler('mouseup', this._onTouchEnd);
      let time = new Date().getTime();
      let point_set = this.pointSpace.mouseEventToPointSet(e);
      let remaining_point_set = { world_space: [], screen_space: [] };
      onTouchEnd(point_set, remaining_point_set, time);
    });

    // Bind equivalent handlers for touch events
    this.clickStartTarget.addEventListener('touchstart', (e: TouchEvent) => {
      // Prevent double-tap-to-zoom
      e.preventDefault();
      let onTouchStart = this._unpackHandler('touchstart', this._onTouchStart);
      let time = new Date().getTime();
      let point_set = this.pointSpace.touchesToPointSet(e.touches);
      onTouchStart(point_set, time);
    });
    this.mouseMoveTarget.addEventListener('touchmove', (e: TouchEvent) => {
      let onTouchMove = this._unpackHandler('touchmove', this._onTouchMove);
      let time = new Date().getTime();
      let point_set = this.pointSpace.touchesToPointSet(e.touches);
      onTouchMove(point_set, time);
    });
    this.mouseMoveTarget.addEventListener('touchend', (e: TouchEvent) => {
      let onTouchEnd = this._unpackHandler('touchend', this._onTouchEnd);
      let time = new Date().getTime();
      let changed_point_set = this.pointSpace.touchesToPointSet(
        e.changedTouches,
      );
      let remaining_point_set = this.pointSpace.touchesToPointSet(e.touches);
      let tool_event = onTouchEnd(changed_point_set, remaining_point_set, time);
    });
  }
}
