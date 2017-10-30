// @flow
import Room from './Room';
import SocketEventQueue from '../../util/socket/SocketEventQueue';
import log from '../../util/log';
import io from 'socket.io';

export type User = {
  id: string,
  seq: number,
  socket: io.Socket,
  incomingEventQueue: SocketEventQueue,
  connected: boolean,
};

export default class UserManager {
  rooms: { [string]: Room };
  users: { [string]: User };
  userRoomMap: { [string]: string };

  constructor() {
    this.rooms = {};
    this.users = {};
    this.userRoomMap = {};
  }

  /**
   * Return true if a given user exists in the user database and the user is
   * marked as connected
   */
  isUserConnected(user_id: string): boolean {
    return this.users.hasOwnProperty(user_id) && this.users[user_id].connected;
  }

  /**
   * Given a user id and a socket, either recover an existing user session or
   * create a new session for the user.
   *
   * return false if a socket for the given user is already connected.
   */
  addOrRecoverUser(user_id: string, socket: io.Socket): boolean {
    // If the user is already connected, don't do that actually
    if (this.isUserConnected(user_id)) {
      throw {
        type: 'duplicate_connection',
        socket_id: socket.id,
        user_id: user_id,
        message: `received duplicate connection for user ${user_id}`,
      };
    }
    if (this.users.hasOwnProperty(user_id)) {
      // User already tracked. Try to recover session
      this.users[user_id].socket = socket;
      this.users[user_id].incomingEventQueue = new SocketEventQueue();
      this.users[user_id].seq = 1;
    } else {
      log.info({
        type: 'add_user',
        user_id: user_id,
        socket_id: socket.id,
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
   * Removes a user from the UserManager.
   *
   * If they are in a room, removes them from the room.
   * If the resulting room is empty, it is deleted.
   */
  removeUser(socket: io.Socket) {
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

  /**
   * Marks a user as disconnected.
   *
   * Will silently succeed and log an error if no user in the router exists
   * for the given user_id
   */
  disconnectUser(user_id: string): void {
    let user = this.users[user_id];
    if (user === undefined) {
      log.error({
        type: 'disconnect_untracked_user',
        user_id: user_id,
        message: `untracked user with id ${user_id} was marked as disconnected`,
      });
      return;
    }
    user.connected = false;
  }

  /**
   * Adds a user to a room
   */
  addUserToRoom(user_id: string, room_id: string): void {
    console.log(`add user '${user_id}' to room '${room_id}'`);
    let user = this.users[user_id];
    if (user === undefined) {
      throw new Error(`user ${user_id} not tracked by this UserManager`);
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
  __createOrGetRoom(room_id: string): Room {
    if (!this.rooms.hasOwnProperty(room_id)) {
      this.rooms[room_id] = new Room(room_id);
      return this.rooms[room_id];
    }
    return this.rooms[room_id];
  }

  /**
   * Look up the room for a user, or null if a user is not in a room.
   */
  getRoomForUser(user_id: string): ?Room {
    let user = this.users[user_id];
    if (user === undefined) {
      throw new Error(`user ${user_id} not tracked by this UserManager`);
    }
    let room_id = this.userRoomMap[user_id];
    return room_id ? this.rooms[room_id] : null;
  }

  getUser(user_id: string): ?User {
    return this.users[user_id] || null;
  }
}
