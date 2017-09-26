import Room from "./Room";
import SocketEventQueue from '../socket/SocketEventQueue';

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
    console.log('add user', socket.id);
    let incoming_event_queue = new SocketEventQueue();

    let new_user = {
      id: socket.id,
      seq: 1,
      socket: socket,
      incomingEventQueue: incoming_event_queue,
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
    let user_id = socket.id
    console.log('remove user', user_id);
    let room_id = this.userRoomMap[user_id];
    if (room_id) {
      let room = this.rooms[this.room_id];
      room.removeUser(user_id);
      if (room.isEmpty()) {
        delete this.rooms[room_id];
      }
    }
    delete this.users[user_id];
    delete this.userRoomMap[user_id];
  }

  addUserToRoom(user_id, room_id) {
    console.log(`add user '${user_id}' to room '${room_id}'`);
    let room = this.__createOrGetRoom(room_id);
    room.addUser
  }

  /**
   * Get a room if it exists. Otherwise, create it.
   */
  __createOrGetRoom(room_id) {
    if (!Object.hasOwnProperty(this.rooms, room_id)) {
      this.rooms[room_id] = new Room(room_id);
      return this.rooms[room_id];
    }
    return this.rooms[room_id];
  }

  getRoomForUser(user_id) {
    let user = this.userRoomMap[user_id];
    if (user === undefined) {
      throw new Error(`user ${user_id} not tracked by this RoomRouter`)
    }
    let room = this.userRoomMap[user_id];
    return room || null;
  }
}
