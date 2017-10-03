import Game from "./Game";
import Drawing from "../../client/pictionary/Drawing";

export default class Pictionary extends Game {
  constructor(room) {
    super(room);
    this.drawing = new Drawing();
  }

  getState() {
    return {
      game: "Pictionary",
      strokes: this.drawing.strokes,
      strokeOrder: this.drawing.strokeOrder
    };
  }

  processClientEvent(user_id, event) {
    switch (event.type) {
      case "add_stroke":
      case "append_stroke":
        this.drawing.ingestEvent(event);
        this.room.broadcast(event, { exclude: [user_id] });
        break;
      default:
        break;
    }
  }
}
