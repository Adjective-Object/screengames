import Room from './Room';
import SocketEventQueue from '../../util/socket/SocketEventQueue';
import log from '../../util/log';
import io from 'socket.io';
import CodedError from '../../util/CodedError';

export default class UserManager {
  constructor() {
    this.rooms = {};
    this.users = {};
    this.userRoomMap = {};
  }

  /**
   * Return true if a given user exists in the user database and the user is
   * marked as connected
   */
  isUserConnected(user_id) {
    return this.users.hasOwnProperty(user_id) && this.users[user_id].connected;
  }

  /**
   * Given a user id and a socket, either recover an existing user session or
   * create a new session for the user.
   *
   * return false if a socket for the given user is already connected.
   */
  addOrRecoverUser(user_id, socket) {
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
      log.debug({
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
  removeUser(user_id) {
    // Throw an error if the user is not in the tracker
    if (!this.users.hasOwnProperty(user_id)) {
      throw new CodedError({
        type: 'user_not_in_manager',
        user_id: user_id,
        message: `user ${user_id} not tracked by this UserManager`,
      });
    }
    log.debug({
      type: 'remove_user',
      user_id: user_id,
      message: `remove user ${user_id}`,
    });
    this.__deleteUserRoomIfEmpty(user_id);
    delete this.users[user_id];
    delete this.userRoomMap[user_id];
  }

  /**
   * Marks a user as disconnected.
   *
   * Will silently succeed and log an error if no user in the router exists
   * for the given user_id
   */
  disconnectUser(user_id) {
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
    this.__deleteUserRoomIfEmpty(user_id);
  }

  /**
   * Adds a user to a room
   */
  addUserToRoom(user_id, room_id) {
    let user = this.users[user_id];
    if (user === undefined) {
      throw new CodedError({
        type: 'add_untracked_user',
        message: `user ${user_id} not tracked by this UserManager`,
        user_id: user_id,
      });
    }
    if (!user.connected) {
      throw new CodedError({
        type: 'add_disconnected_user',
        message: `user ${user_id} is disconnected`,
        user_id: user_id,
      });
    }
    let room = this.__createOrGetRoom(room_id);
    room.addParticipant(this.users[user_id]);
    let participant_ids = room.getParticipantIDs();
    log.debug({
      type: 'add_user_to_room',
      message: `add user '${user_id}' to room '${room_id}', new participants are ${participant_ids}`,
      user_id,
      room_id,
      participants: participant_ids,
    });
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

  __deleteUserRoomIfEmpty(user_id) {
    let room = this.getRoomForUser(user_id);
    if (room) {
      room.removeParticipant(user_id);
      if (room.isEmpty()) {
        log.info({
          type: 'delete_room',
          user_id: user_id,
          message: `delete empty room ${room.id}`,
        });
        delete this.rooms[room.id];
      }
    }
  }

  /**
   * Look up the room for a user, or null if a user is not in a room.
   */
  getRoomForUser(user_id) {
    let user = this.users[user_id] || null;
    if (user === null) {
      return null;
      log.warn({
        type: 'user_not_in_manager',
        user_id: user_id,
        message: `user ${user_id} not tracked by this UserManager`,
      });
    }
    let room_id = this.userRoomMap[user_id];
    return room_id ? this.rooms[room_id] : null;
  }

  getUser(user_id) {
    return this.users[user_id] || null;
  }

  getRoom(room_id) {
    return this.rooms[room_id] || null;
  }
}
