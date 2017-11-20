// @flow
import Pictionary from '../games/Pictionary';
import { mapValues, every } from 'lodash';
import log from '../../util/log';
import { id_to_string } from '../../util/ID';
import type User from './User';
import type { Game } from '../games/Game';
import type { Event } from '../Event';
import type io from 'socket.io';
import type { ID_of } from '../../util/ID';

export type Participant = {
  user: User,
  userData: {
    name?: string,
    [string]: any,
  },
};

class Room {
  id: ID_of<Room>;
  currentGame: Game;
  participants: Map<ID_of<User>, Participant>;

  constructor(room_id: ID_of<Room>) {
    this.id = room_id;
    this.currentGame = new Pictionary(this);
    this.participants = new Map();
  }

  /**
   * Takes in an event from a client and process it. If the event is not
   * recognized by the Room handler, passes it off to the current Game
   */
  processClientEvent(user_id: ID_of<User>, event: any) {
    if (!typeof event === 'object' || event.type === undefined) {
      log.warn(`got typeless event ${event}`);
      return;
    }

    this.currentGame.processClientEvent(user_id, event);
  }

  addParticipant(user: User): void {
    let initialUserData = this.currentGame.getInitialUserData(user);
    this.participants.set(user.id, {
      user: user,
      userData: initialUserData,
    });

    this.__sendInitialGameState(user);

    this.broadcast(
      {
        type: 'add_user',
        user_id: user.id,
        user_data: initialUserData,
      },
      {
        exclude: [user.id],
      },
    );
  }

  recoverParticipantSession(user: User): void {
    this.__sendInitialGameState(user);
  }

  __sendInitialGameState(user: User): void {
    // Send initial information about other users to clients as they join
    let participant_user_data = {};
    for (let [
      participant_id: ID_of<User>,
      participant: Participant,
    ] of this.participants.entries()) {
      participant_user_data[id_to_string(participant_id)] =
        participant.userData;
    }
    user.socket.emit('event', {
      type: 'initialize',
      seq: user.seq++,
      initial_state: this.currentGame.getState(),
      participant_user_data,
    });
  }

  removeParticipant(user_id: ID_of<User>): void {
    this.broadcast({
      type: 'remove_user',
      user_id: user_id,
    });
    this.participants.delete(user_id);
  }

  /**
   * A room is empty if every user is empty or if all users in the
   * room are not connected.
   */
  isEmpty(): boolean {
    return (
      this.participants.size === 0 ||
      every(
        Array.from(this.participants.values()),
        participant => !participant.user.connected,
      )
    );
  }

  updateUserData(user_id: ID_of<User>, user_data: any): void {
    let participant = this.participants.get(user_id);
    if (participant === undefined) {
      log.warn({
        type: 'update_nonexistant_user_data',
        user_id: user_id,
        message:
          `updateUserData called for user ${id_to_string(user_id)}` +
          ` not tracked in room ${id_to_string(this.id)}`,
      });
      return;
    }
    participant.userData = user_data;
    // Broadcast the change to the members of the room
    this.broadcast({
      type: 'update_user',
      user_id: user_id,
      userData: participant.userData,
    });
  }

  broadcast(message: any, opts: { exclude?: ID_of<User>[] } = {}): void {
    let exclude = opts.exclude || [];
    for (let [participant_id, participant] of this.participants.entries()) {
      // Exclude some fparticipants from the broadcast
      if (exclude.indexOf(participant_id) !== -1) {
        continue;
      }
      participant.user.socket.emit(
        'event',
        Object.assign(
          {
            seq: participant.user.seq++,
          },
          message,
        ),
      );
    }
  }

  getParticipantIDs(): ID_of<User>[] {
    return Array.from(this.participants.keys());
  }

  getParticipants(): Participant[] {
    return Array.from(this.participants.values());
  }
}

export default Room;
