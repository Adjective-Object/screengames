import log from "../../../util/log";

export default class CanvasPanningTool {
  constructor() {
    log.info("touch start");
  }

  onTouchMove() {
    log.info("touch moved");
  }

  onTouchEnd() {
    log.info("touch end");
  }

  isActive() {
    return false;
  }
}
