// @flow
import Room from './Room';
import SocketEventQueue from '../../util/socket/SocketEventQueue';
import log from '../../util/log';
import type io from 'socket.io';
import CodedError from '../../util/CodedError';
import { make_id_of, id_to_string } from '../ID';
import type { Candidate_ID_of, ID_of } from '../ID';

export type User = {
  id: ID_of<User>,
  socket: io.Socket,
  incomingEventQueue: SocketEventQueue,
  seq: number,
  connected: boolean,
};

export default class UserManager {
  rooms: { [ID_of<Room>]: Room };
  users: { [ID_of<User>]: User };
  userRoomMap: { [ID_of<User>]: ID_of<Room> };

  constructor() {
    this.rooms = {};
    this.users = {};
    this.userRoomMap = {};
  }

  /**
   * Return true if a given user exists in the user database and the user is
   * marked as connected
   */
  isUserConnected(user_id: ID_of<User>) {
    return this.users.hasOwnProperty(user_id) && this.users[user_id].connected;
  }

  /**
   * Given a user id and a socket, either recover an existing user session or
   * create a new session for the user.
   *
   * return false if a socket for the given user is already connected.
   */
  addOrRecoverUser(user_id: ID_of<User>, socket: io.Socket) {
    // If the user is already connected, don't do that actually
    if (this.isUserConnected(user_id)) {
      let connected_user = this.users[user_id];
      throw {
        type: 'duplicate_connection',
        socket_id: socket.id,
        user_id,
        message:
          `received duplicate connection for user ` +
          id_to_string(user_id) +
          ` (currently on socket ${connected_user.socket.id}` +
          ` from socket ${socket.id}`,
      };
    }
    if (this.users.hasOwnProperty(user_id)) {
      // User already tracked. Try to recover session
      this.users[user_id].socket = socket;
      this.users[user_id].incomingEventQueue = new SocketEventQueue();
      this.users[user_id].seq = 1;
      this.users[user_id].connected = true;
    } else {
      log.debug({
        type: 'add_user',
        user_id: user_id,
        socket_id: socket.id,
        message: `add user ${id_to_string(user_id)} from socket ${socket.id}`,
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
  removeUser(user_id: ID_of<User>) {
    // Throw an error if the user is not in the tracker
    if (!this.users.hasOwnProperty(user_id)) {
      throw new CodedError({
        type: 'user_not_in_manager',
        user_id: user_id,
        message: `user ${id_to_string(
          user_id,
        )} not tracked by this UserManager`,
      });
    }
    log.debug({
      type: 'remove_user',
      user_id: user_id,
      message: `remove user ${id_to_string(user_id)}`,
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
  disconnectUser(user_id: ID_of<User>) {
    let user = this.users[user_id];
    if (user === undefined) {
      log.error({
        type: 'disconnect_untracked_user',
        user_id: user_id,
        message: `untracked user with id ${id_to_string(
          user_id,
        )} was marked as disconnected`,
      });
      return;
    }
    log.info({
      type: 'disconnect_user',
      user_id: user_id,
      message: `user ${id_to_string(user_id)} on socket ${user.socket
        .id} was marked disconnected`,
    });
    user.connected = false;
    this.__deleteUserRoomIfEmpty(user_id);
  }

  /**
   * Adds a user to a room
   */
  addUserToRoom(user_id: ID_of<User>, room_id: ID_of<Room>): void {
    let user = this.users[user_id];
    if (user === undefined) {
      throw new CodedError({
        type: 'add_untracked_user',
        message: `user ${id_to_string(
          user_id,
        )} not tracked by this UserManager`,
        user_id: user_id,
      });
    }
    if (!user.connected) {
      throw new CodedError({
        type: 'add_disconnected_user',
        message: `user ${id_to_string(user_id)} is disconnected`,
        user_id: user_id,
      });
    }
    let room = this.__createOrGetRoom(room_id);
    room.addParticipant(this.users[user_id]);
    let participant_ids = room.getParticipantIDs();
    log.debug({
      type: 'add_user_to_room',
      message: `add user '${id_to_string(user_id)}' to room '${id_to_string(
        room_id,
      )}', new participants are ${participant_ids.toString()}`,
      user_id,
      room_id,
      participants: participant_ids,
    });
    this.userRoomMap[user_id] = room_id;
  }

  /**
   * Get a room if it exists. Otherwise, create it.
   */
  __createOrGetRoom(room_id: ID_of<Room>): Room {
    if (!this.rooms.hasOwnProperty(room_id)) {
      this.rooms[room_id] = new Room(room_id);
      return this.rooms[room_id];
    }
    return this.rooms[room_id];
  }

  __deleteUserRoomIfEmpty(user_id: ID_of<User>): void {
    let room = this.getRoomForUser(user_id);
    if (room === null) return;
    room.removeParticipant(user_id);
    delete this.userRoomMap[user_id];

    if (!room.isEmpty()) return;
    log.debug({
      type: 'delete_room',
      user_id: user_id,
      message: `delete empty room ${id_to_string(room.id)}`,
    });
    delete this.rooms[room.id];
    // Remove existing entries from the user room map for the deleted room
    // (disconnected users that are still tracked)
    let participants = room.getParticipants();
    for (let participant of participants) {
      delete this.userRoomMap[participant.user.id];
    }
  }

  /**
   * Look up the room for a user, or null if a user is not in a room.
   */
  getRoomForUser(user_id: ID_of<User>): Room | null {
    let user = this.users[user_id];
    if (user === undefined) {
      log.warn({
        type: 'user_not_in_manager',
        user_id: user_id,
        message: `user ${id_to_string(
          user_id,
        )} not tracked by this UserManager`,
      });
      return null;
    }
    let room_id = this.userRoomMap[user_id];
    return room_id ? this.rooms[room_id] : null;
  }

  getUser(user_id: ID_of<User>): User | null {
    return this.users[user_id] || null;
  }

  getRoom(room_id: ID_of<Room>): Room | null {
    return this.rooms[room_id] || null;
  }
}
