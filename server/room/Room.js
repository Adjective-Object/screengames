import Pictionary from "../games/Pictionary";

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
    this.currentGame = new Pictionary(this);
    this.participants = {};
  }

  /**
   * Takes in an event from a client and process it. If the event is not
   * recognized by the Room handler, passes it off to the current Game
   */
  processClientEvent(event) {
    if (event.type === undefined) {
      console.error(`got typeless event ${event}`);
      return;
    }

    this.currentGame.processClientEvent(event);
  }

  addParticipant(user) {
    this.participants[user.id] = {
      user: user,
      userData: {}
    };

    // Send initial information about other users to clients as they join
    user.socket.send({
      seq: user.seq++,
      type: "join_request_success",
      participant_userData: this.participants.map(
        participant => participant.userData
      ),
      initial_state: this.currentGame.getState()
    });

    this.__updateUserData(user.id, {})
  }

  removeParticipant(user_id) {
    this.__broadcast({
      type: 'remove_user',
      user_id: user_id,
    });
    delete this.participants[user_id];
  }

  isEmpty() {
    return Object.keys(this.participants).length === 0
  }

  updateUserData(user_id, user_data) {
    this.users[user_id].userData = user_data;
    // Broadcast the change to the members of the room
    this.__broadcast({
      type: "update_user",
      user_id: user.id,
      userData: participant.userData,
    });
  }

  broadcast(message) {
    this.participants.map(participant =>
      participant.socket.send(Object.assign({
        seq: participant.seq++,
      }, message))
    );    
  }
}

export default Room;
