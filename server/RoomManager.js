import Room from "./Room";

class RoomManager {
  constructor() {
    this.rooms = {};
  }

  createRoom(room_id, passcode) {
    let room = new Room(room_id);
    room.passcode = passcode;
    this.rooms = room;
  }

  checkRoomPassword(room_id, passcode) {
    let expected_passcode = this.room[room_id].passcode;
    return expected_passcode !== undefined && expected_passcode === passcode;
  }

  getRoom(room_id) {}
}

export default RoomManager;
