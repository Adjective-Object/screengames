import Room from './Room';
import SocketEventQueue from '../../util/socket/SocketEventQueue';
import log from '../../util/log'
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

  addOrRecoverUser(user_id, socket) {
    if (this.users.hasOwnProperty(user_id)) {
      // User already tracked. Try to recover session
      if (this.users[user_id].connected) {
        // Session already connected. Do nothing
        return false;
      }
      this.users[user_id].socket = socket;
      this.users[user_id].incomingEventQueue = new SocketEventQueue();
      this.users[user_id].seq = 1;
    } else {
      log.info({
        type: 'add_user',
        user_id: user_id,
        socket_id: socket.id
      });
      this.users[user_id] = {
        id: user_id,
        seq: 1,
        socket: socket,
        incomingEventQueue: new SocketEventQueue(),
        connected: true,
      };
    }
    return true;
  }

  /**
   * Removes a user from the RoomRouter.
   *
   * If they are in a room, removes them from the room.
   * If the resulting room is empty, it is deleted.
   */
  removeUser(socket) {
    let user_id = socket.id;
    console.log('remove user', user_id);
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

  disconnectUser(user_id) {
    let user = this.users[user_id];
    if (user === undefined) {
      log.error({
        type: 'disconnect_untracked_user',
        user_id: user_id,
        message: `untracked user with id ${user_id} was marked as disconnected`,
      })
      return;
    }
    user.connected = false;
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

  getUser(user_id) {
    return this.users[user_id];
  }
}
