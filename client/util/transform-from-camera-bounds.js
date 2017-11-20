import { transform, scale, translate } from 'transformation-matrix';
export type BoundingRect = {
  x: number,
  y: number,
  width: number,
  height: number,
};

export default function getTransform(
  bounds: BoundingRect,
  margin_percent: number,
  drawTarget: _HTMLSvgElement,
): Matrix {
  let scale_ratio = Math.min(
    drawTarget.viewBox.baseVal.width / bounds.width,
    drawTarget.viewBox.baseVal.height / bounds.height,
    1,
  );
  let margin_ratio = 1 + margin_percent * 2;
  let trans = transform(
    scale(scale_ratio, scale_ratio),
    translate(-bounds.x, -bounds.y),
    scale(1 / margin_ratio, 1 / margin_ratio),
    translate(
      margin_percent * drawTarget.viewBox.baseVal.width / 2,
      margin_percent * drawTarget.viewBox.baseVal.height / 2,
    ),
  );
  return trans;
}
