import socketio from 'socket.io';
import UserManager from '../room/UserManager';
import log from '../../util/log';

let userManager = new UserManager();

let bindClientEvents = socket => {
  let socket_user_id = null;
  socket.on('join_room', ({ room_id, user_id }) => {
    // Add a user or do nothing if they were not added correctly.
    try {
      userManager.addOrRecoverUser(user_id, socket);
    } catch (e) {
      log.error(e);
      socket.disconnect();
      return;
    }
    socket_user_id = user_id;

    let current_room = userManager.getRoomForUser(user_id);
    if (current_room === null) {
      userManager.addUserToRoom(socket_user_id, room_id);
    } else if (current_room.id === room_id) {
      let user = userManager.getUser(user_id);
      current_room.recoverParticipantSession(user);
    } else {
      log.error({
        type: 'change_rooms_not_implemented',
        message: "can't yet change rooms",
      });
    }
  });

  socket.on('event', event => {
    if (socket_user_id === null) {
      log.error({
        type: 'event_before_join_room',
        socket_id: socket.id,
        user_id: socket_user_id,
        event: event,
        message: `got event before join_room`,
      });
      return;
    }
    let room = userManager.getRoomForUser(socket_user_id);
    if (room) {
      room.processClientEvent(socket_user_id, event);
    } else {
      console.log(`client ${socket_user_id} is not in a room?`);
    }
  });

  socket.on('disconnect', () => {
    if (socket_user_id) {
      userManager.disconnectUser(socket_user_id);
    }
  });
};

let io = new socketio();
io.on('connect', socket => {
  console.log('got socket client', socket.id);
  bindClientEvents(socket);
});

export default io;
