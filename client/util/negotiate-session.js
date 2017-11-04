// @flow
import type io from 'socket.io';
import Cookies from 'js-cookie';
import type User from '../../server/room/User';
import { make_id_of } from '../../util/ID';
import type { ID_of } from '../../util/ID';
import log from '../../util/log';

export type Credentials = {
  user_id: ID_of<User>,
  nonce: string,
};

function setCookiesAndResolve(resolve, { user_id, nonce }) {
  Cookies.set('user_id', user_id);
  Cookies.set('nonce', nonce);
  resolve({ user_id, nonce });
}

export default function initSession(
  socket: io.socket,
  should_use_cookies: boolean = true,
): Promise<Credentials> {
  let user_id = null;
  let nonce = null;

  if (should_use_cookies) {
    log.debug({
      type: 'load_credentials_from_cookie',
      message: `trying to load credentials from cookie`,
    });
    user_id = Cookies.get('user_id') || null;
    nonce = Cookies.get('nonce') || null;
  }

  return new Promise((resolve, reject) => {
    socket.on('connect', () => {
      if (user_id === null || nonce === null) {
        log.debug({
          type: 'login_new_user',
          message: `logging in as new user`,
        });
        socket.emit('log_in');
      } else {
        let credentials = {
          user_id,
          nonce,
        };
        log.debug({
          type: 'login_cached_user',
          message:
            `logging in as new user with credentials` +
            JSON.stringify(credentials),
        });
        socket.emit('log_in', credentials);
      }
    });

    socket.on('login_success', (response: Credentials) => {
      log.debug({
        type: 'login_succes',
        message: `logged in with credentials ${JSON.stringify(response)}`,
        credentials: response,
      });
      setCookiesAndResolve(resolve, response);
    });

    socket.on('login_failed', error => {
      log.debug({
        type: 'login_failed',
        message: `login failed with error ${error.message}`,
        error: error,
      });
      reject(error);
    });
  });
}
