// @flow
import type io from 'socket.io';
import type { ID_of } from '../../util/ID';
import SocketEventQueue from '../../util/socket/SocketEventQueue';

export default class User {
  id: ID_of<User>;
  nonce: string;
  connected: boolean;
  socket: io.Socket;
  incomingEventQueue: SocketEventQueue;
  seq: number;

  constructor(user_id: ID_of<User>, nonce: string) {
    this.id = user_id;
    this.nonce = nonce;
    this.connected = false;
  }

  connect(socket: io.Socket) {
    if (this.socket) {
      this.socket.disconnect();
    }
    this.connected = true;
    this.seq = 1;
    this.incomingEventQueue = new SocketEventQueue();
    this.socket = socket;
  }

  disconnect() {
    this.connected = false;
  }

  isConnected() {
    return this.connected;
  }
}
