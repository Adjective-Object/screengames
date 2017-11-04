// @flow
import transformToCanvasSpace from './transform-to-canvas-space';
import type Camera from './Camera';
import type { Point } from './Drawing';

export type PointSet = {
  world_space: Point[],
  screen_space: Point[],
};

export default class PointSpace {
  camera: Camera;
  drawTarget: HTMLSvgElement;

  constructor(camera: Camera, draw_target: HTMLSvgElement) {
    this.camera = camera;
    this.drawTarget = draw_target;
  }

  mouseEventToPointSet(mouse_event: MouseEvent): PointSet {
    return {
      world_space: [
        transformToCanvasSpace(this.camera, this.drawTarget, mouse_event),
      ],
      screen_space: [{ x: mouse_event.clientX, y: mouse_event.clientY }],
    };
  }

  touchesToPointSet(touches: TouchList): PointSet {
    let world_space_points = Array.from(touches).map(
      transformToCanvasSpace.bind(null, this.camera, this.drawTarget),
    );
    let screen_space_points = Array.from(touches).map(touch => ({
      x: touch.clientX,
      y: touch.clientY,
    }));
    return {
      world_space: world_space_points,
      screen_space: screen_space_points,
    };
  }
}
