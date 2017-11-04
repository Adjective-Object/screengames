// @flow
import socketio from 'socket.io';
import UserManager from '../room/UserManager';
import log from '../../util/log';
import guid from '../../util/guid';
import { make_id_of } from '../../util/ID';
import type { ID_of } from '../../util/ID';
import type User from '../room/User';
import type Room from '../room/Room';

let userManager = new UserManager();

type Credentials = { user_id: ID_of<User>, nonce: string };

let initSocket = socket => {
  let user_id = null;

  // Create a user for the provided user_id / nonce if one does not already
  // exist, otherwise check the nonce against the existing user
  // If no credentials are provided, create a new user and send those creds
  // back
  socket.on('log_in', (credentials: ?Credentials): void => {
    try {
      let logging_in_user_id: ?ID_of<User> = null;
      let logging_in_nonce: ?string = null;
      if (credentials) {
        logging_in_user_id = credentials.user_id;
        logging_in_nonce = credentials.nonce;
        if (!userManager.doesUserExist(logging_in_user_id)) {
          log.info({
            type: 'login_and_create_user_for_credentials',
            message:
              `creating new user ${String(logging_in_user_id)}` +
              ` on login with credentials`,
            user_id: logging_in_user_id,
          });
          userManager.createUser(logging_in_user_id, logging_in_nonce);
        } else {
          log.info({
            type: 'login_existing_user',
            message: `logging in user ${String(logging_in_user_id)}`,
            user_id: logging_in_user_id,
          });
        }
        userManager.connectUserSession(
          logging_in_user_id,
          logging_in_nonce,
          socket,
        );
      } else {
        logging_in_user_id = make_id_of(guid());
        logging_in_nonce = guid();
        log.info({
          type: 'login_create_new_user',
          message: `creating new user ${String(logging_in_user_id)} on login`,
          user_id: logging_in_user_id,
        });
        userManager.createUser(logging_in_user_id, logging_in_nonce);
        userManager.connectUserSession(
          logging_in_user_id,
          logging_in_nonce,
          socket,
        );
      }
      let logged_in_credentials: Credentials = {
        user_id: logging_in_user_id,
        nonce: logging_in_nonce,
      };
      socket.emit('login_success', logged_in_credentials);
    } catch (e) {
      socket.emit('login_failed', {
        error: e,
      });
    }
  });

  socket.on(
    'join_room',
    (request: {
      user_id: ID_of<User>,
      nonce: string,
      room_id: ID_of<Room>,
    }) => {
      user_id = request.user_id;
      let { nonce, room_id } = request;
      // Add a user or do nothing if they were not added correctly.
      try {
      } catch (e) {
        log.error(e);
        socket.disconnect();
        return;
      }

      let current_room = userManager.getRoomForUser(user_id);
      if (current_room === null) {
        userManager.addUserToRoom(user_id, room_id);
      } else if (current_room.id === room_id) {
        let user = userManager.getUser(user_id);
        userManager.addUserToRoom(user_id, room_id);
      } else {
        log.error({
          type: 'change_rooms_not_implemented',
          message: "can't yet change rooms",
        });
      }
    },
  );

  socket.on('event', event => {
    if (user_id === null) {
      log.error({
        type: 'event_before_join_room',
        socket_id: socket.id,
        user_id: user_id,
        event: event,
        message: `got event ${event.type} before join_room`,
      });
      return;
    }
    let room = userManager.getRoomForUser(user_id);
    if (room) {
      room.processClientEvent(user_id, event);
    } else {
      console.log(`client ${String(user_id)} is not in a room?`);
    }
  });

  socket.on('disconnect', () => {
    if (user_id) {
      userManager.disconnectUser(user_id);
    }
  });
};

let io = new socketio();
io.on('connect', socket => {
  log.debug({
    type: 'socket_connect',
    socket_id: socket.id,
    message: `got socket client ${socket.id}`,
  });
  initSocket(socket);
});

export default io;
