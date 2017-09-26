import Game from "./Game";

export default class Pictionary extends Game {
  getState() {
    return null;
  }

  processClientEvent(user_id, event) {
    switch (event.type) {
      case "add_stroke":
      case "append_stroke":
        this.room.broadcast(event, { exclude: [user_id] });
        break;
      default:
        break;
    }
  }
}
