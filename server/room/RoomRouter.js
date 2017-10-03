import Room from "./Room";
import SocketEventQueue from "../../util/socket/SocketEventQueue";

/*

interface User {
  id: string
  seq: number
  socket: io.Socket,
  incomingEventQueue: SocketEventQueue
}

*/

export default class RoomRouter {
  constructor() {
    this.rooms = {};
    this.users = {};
    this.userRoomMap = {};
  }

  addUser(socket) {
    console.log("add user", socket.id);
    let incoming_event_queue = new SocketEventQueue();

    let new_user = {
      id: socket.id,
      seq: 1,
      socket: socket,
      incomingEventQueue: incoming_event_queue
    };

    this.users[new_user.id] = new_user;
  }

  /**
   * Removes a user from the RoomRouter.
   *
   * If they are in a room, removes them from the room.
   * If the resulting room is empty, it is deleted.
   */
  removeUser(socket) {
    let user_id = socket.id;
    console.log("remove user", user_id);
    let room = this.getRoomForUser(user_id);
    if (room) {
      room.removeParticipant(user_id);
      if (room.isEmpty()) {
        console.log(`deleting room ${room.id} since it is now empty`);
        delete this.rooms[room.id];
      }
    }
    delete this.users[user_id];
    delete this.userRoomMap[user_id];
  }

  addUserToRoom(user_id, room_id) {
    console.log(`add user '${user_id}' to room '${room_id}'`);
    let user = this.users[user_id];
    if (user === undefined) {
      throw new Error(`user ${user_id} not tracked by this RoomRouter`);
    }
    let room = this.__createOrGetRoom(room_id);
    room.addParticipant(this.users[user_id]);
    let participant_ids = room.getParticipantIDs();
    console.log(`room ${room_id} now has users ${participant_ids}`);
    this.userRoomMap[user_id] = room_id;
  }

  /**
   * Get a room if it exists. Otherwise, create it.
   */
  __createOrGetRoom(room_id) {
    if (!this.rooms.hasOwnProperty(room_id)) {
      this.rooms[room_id] = new Room(room_id);
      return this.rooms[room_id];
    }
    return this.rooms[room_id];
  }

  getRoomForUser(user_id) {
    let user = this.users[user_id];
    if (user === undefined) {
      throw new Error(`user ${user_id} not tracked by this RoomRouter`);
    }
    let room_id = this.userRoomMap[user_id];
    return room_id ? this.rooms[room_id] : null;
  }
}
