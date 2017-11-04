// @flow
import Room from './Room';
import SocketEventQueue from '../../util/socket/SocketEventQueue';
import log from '../../util/log';
import type io from 'socket.io';
import CodedError, { invariantViolation } from '../../util/CodedError';
import { make_id_of } from '../../util/ID';
import type { Candidate_ID_of, ID_of } from '../../util/ID';
import User from './User';

export default class UserManager {
  rooms: Map<ID_of<Room>, Room>;
  users: Map<ID_of<User>, User>;
  userRoomMap: Map<ID_of<User>, ID_of<Room>>;

  constructor() {
    this.rooms = new Map();
    this.users = new Map();
    this.userRoomMap = new Map();
  }

  createUser(user_id: ID_of<User>, nonce: string): void {
    this.users.set(user_id, new User(user_id, nonce));
  }

  /**
   * Return true if a given user exists in the user map and the user is
   * marked as connected
   */
  doesUserExist(user_id: ID_of<User>): boolean {
    return this.users.has(user_id);
  }

  /**
   * Return true if a given user exists in the user map and the user is
   * marked as connected
   */
  isUserConnected(user_id: ID_of<User>): boolean {
    let user = this.users.get(user_id);
    return (
      this.users.hasOwnProperty(user_id) && user !== undefined && user.connected
    );
  }

  /**
   * Given a user id and a socket, either recover an existing user session or
   * create a new session for the user.
   *
   * return false if a socket for the given user is already connected.
   */
  connectUserSession(
    user_id: ID_of<User>,
    nonce: string,
    socket: io.Socket,
  ): void {
    // If the user is already connected, boot them from the room and overwrite
    // the socket if the nonce matches
    let current_user = this.users.get(user_id);
    if (!current_user) {
      throw new CodedError({
        type: 'connect_nonexistant_user',
        socket_id: socket.id,
        user_id,
        message:
          `tried to connect nonexistant user ` +
          String(user_id) +
          ` on socket ${socket.id}`,
      });
    }
    if (nonce !== current_user.nonce) {
      throw new CodedError({
        type: 'incorrect_nonce',
        socket_id: socket.id,
        user_id,
        message:
          `submitted mismatched nonce ${nonce} for user ` +
          String(user_id) +
          ` on socket ${socket.id}`,
      });
    }
    log.info({
      type: 'connect_user_session',
      user_id,
      socket_id: socket.id,
      message: `connected user ${String(user_id)} on socket ${String(
        socket.id,
      )}`,
    });
    current_user.connect(socket);
  }

  /**
   * Removes a user from the UserManager.
   *
   * If they are in a room, removes them from the room.
   * If the resulting room is empty, it is deleted.
   */
  removeUser(user_id: ID_of<User>) {
    // Throw an error if the user is not in the tracker
    if (!this.users.has(user_id)) {
      throw new CodedError({
        type: 'user_not_in_manager',
        user_id: user_id,
        message: `user ${String(user_id)} not tracked by this UserManager`,
      });
    }
    log.debug({
      type: 'remove_user',
      user_id: user_id,
      message: `remove user ${String(user_id)}`,
    });
    this.__deleteUserRoomIfEmpty(user_id);
    this.users.delete(user_id);
    this.userRoomMap.delete(user_id);
  }

  /**
   * Marks a user as disconnected.
   *
   * Will silently succeed and log an error if no user in the router exists
   * for the given user_id
   */
  disconnectUser(user_id: ID_of<User>) {
    let user = this.users.get(user_id);
    if (!user) {
      log.error({
        type: 'disconnect_untracked_user',
        user_id: user_id,
        message: `untracked user with id ${String(
          user_id,
        )} was marked as disconnected`,
      });
      return;
    }
    let socket_id = user.socket ? user.socket.id : '<no socket>';
    log.info({
      type: 'disconnect_user',
      user_id: user_id,
      message:
        `user ${String(user_id)} on` +
        ` socket ${socket_id} was marked disconnected`,
    });
    user.disconnect();
    this.__deleteUserRoomIfEmpty(user_id);
  }

  /**
   * Adds a user to a room
   */
  addUserToRoom(user_id: ID_of<User>, room_id: ID_of<Room>): void {
    let user = this.users.get(user_id);
    if (!user) {
      throw new CodedError({
        type: 'add_untracked_user',
        message: `user ${String(user_id)} not tracked by this UserManager`,
        user_id: user_id,
      });
    }
    if (!user.isConnected()) {
      throw new CodedError({
        type: 'add_disconnected_user',
        message: `tried to add disconnected user ${String(user_id)}`,
        user_id: user_id,
      });
    }
    let room = this.__createOrGetRoom(room_id);
    room.addParticipant(user);
    let participant_ids = room.getParticipantIDs();
    log.debug({
      type: 'add_user_to_room',
      message: `add user '${String(user_id)}' to room '${String(
        room_id,
      )}', new participants are ${participant_ids.toString()}`,
      user_id,
      room_id,
      participants: participant_ids,
    });
    this.userRoomMap.set(user_id, room_id);
  }

  /**
   * Get a room if it exists. Otherwise, create it.
   */
  __createOrGetRoom(room_id: ID_of<Room>): Room {
    let room = this.rooms.get(room_id);
    if (!room) {
      room = new Room(room_id);
      this.rooms.set(room_id, room);
    }
    return room;
  }

  __deleteUserRoomIfEmpty(user_id: ID_of<User>): void {
    let room = this.getRoomForUser(user_id);
    if (room === null) return;
    room.removeParticipant(user_id);
    this.userRoomMap.delete(user_id);

    if (!room.isEmpty()) return;
    log.info({
      type: 'delete_room',
      user_id: user_id,
      message: `delete empty room ${String(room.id)}`,
    });
    this.rooms.delete(room.id);
    // Remove existing entries from the user room map for the deleted room
    // (disconnected users that are still tracked)
    let participants = room.getParticipants();
    for (let participant of participants) {
      this.userRoomMap.delete(participant.user.id);
    }
  }

  /**
   * Look up the room for a user, or null if a user is not in a room.
   */
  getRoomForUser(user_id: ID_of<User>): Room | null {
    let user = this.users.get(user_id);
    if (!user) {
      log.warn({
        type: 'user_not_in_manager',
        user_id: user_id,
        message: `user ${String(user_id)} not tracked by this UserManager`,
      });
      return null;
    }
    let room_id = this.userRoomMap.get(user_id);
    return room_id ? this.rooms.get(room_id) || null : null;
  }

  getUser(user_id: ID_of<User>): User | null {
    return this.users.get(user_id) || null;
  }

  getRoom(room_id: ID_of<Room>): Room | null {
    return this.rooms.get(room_id) || null;
  }
}
