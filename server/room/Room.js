import Pictionary from '../games/Pictionary';
import { mapValues, every } from 'lodash';
import log from '../../util/log';

/*
type Participant {
    socket: io.Socket,
    userData: {
        name: string,
    },
}
*/

class Room {
  constructor(room_id) {
    this.id = room_id;
    this.currentGame = new Pictionary(this);
    this.participants = {};
  }

  /**
   * Takes in an event from a client and process it. If the event is not
   * recognized by the Room handler, passes it off to the current Game
   */
  processClientEvent(user_id, event) {
    if (event.type === undefined) {
      log.warn(`got typeless event ${event}`);
      return;
    }

    this.currentGame.processClientEvent(user_id, event);
  }

  addParticipant(user) {
    this.participants[user.id] = {
      user: user,
      userData: {},
    };

    this.__sendGameState(user);

    this.updateUserData(user.id, {});
  }

  recoverParticipantSession(user) {
    this.__sendGameState(user);
  }

  __sendGameState(user) {
    // Send initial information about other users to clients as they join
    user.socket.emit('event', {
      seq: user.seq++,
      type: 'join_request_success',
      participant_user_data: mapValues(
        this.participants,
        participant => participant.userData,
      ),
    });

    user.socket.emit('event', {
      seq: user.seq++,
      type: 'initialize',
      initial_state: this.currentGame.getState(),
    });
  }

  removeParticipant(user_id) {
    this.broadcast({
      type: 'remove_user',
      user_id: user_id,
    });
    delete this.participants[user_id];
  }

  /**
   * A room is empty if every user is empty or if all users in the
   * room are not connected.
   */
  isEmpty() {
    return (
      Object.keys(this.participants).length === 0 ||
      every(this.participants, participant => !participant.user.connected)
    );
  }

  updateUserData(user_id, user_data) {
    let participant = this.participants[user_id];
    participant.userData = user_data;
    // Broadcast the change to the members of the room
    this.broadcast({
      type: 'update_user',
      user_id: user_id,
      userData: participant.userData,
    });
  }

  broadcast(message, opts = {}) {
    let exclude = opts.exclude || [];
    Object.keys(this.participants).map(participant_id => {
      // Exclude some participants from the broadcast
      if (exclude.indexOf(participant_id) !== -1) {
        return;
      }
      let participant = this.participants[participant_id];
      participant.user.socket.emit(
        'event',
        Object.assign(
          {
            seq: participant.user.seq++,
          },
          message,
        ),
      );
    });
  }

  getParticipantIDs() {
    return Object.keys(this.participants);
  }
}

export default Room;
