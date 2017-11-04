// @flow
import type Camera from './Camera';
import { inverse as inverseMatrix, applyToPoint } from 'transformation-matrix';
import type { Matrix } from 'transformation-matrix';

// Convert from DOM space to canvas space based on the current SVG bounding
// rectangle and the viewbox of the rtarget
const transformToCanvasSpace = (
  camera: Camera,
  draw_target: HTMLSvgElement,
  mouse_event: { clientX: number, clientY: number },
): Matrix => {
  let boundingRect = draw_target.getBoundingClientRect();
  // Get location of the mouse event in SVG space
  let viewbox_x =
    (mouse_event.clientX - boundingRect.left) /
      boundingRect.width *
      draw_target.viewBox.baseVal.width +
    draw_target.viewBox.baseVal.x;
  let viewbox_y =
    (mouse_event.clientY - boundingRect.top) /
      boundingRect.height *
      draw_target.viewBox.baseVal.height +
    draw_target.viewBox.baseVal.y;
  return applyToPoint(inverseMatrix(camera.transform), {
    x: viewbox_x,
    y: viewbox_y,
  });
};

export default transformToCanvasSpace;
