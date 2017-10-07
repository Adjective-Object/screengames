import { transform, identity } from "transformation-matrix";
export default class Camera {
  constructor() {
    this.transform = identity();
  }

  ingestEvent(event) {
    switch (event.type) {
      case "adjust_transform":
        this.transform = transform(this.transform, event.transform);
        return true;
      default:
        return false;
    }
  }

  canIngestEvent(event) {
    const allowed_events = ["adjust_transform"];
    return allowed_events.indexOf(event.type) !== -1;
  }
}