// @flow
import type { IEventConsumer } from './IEventConsumer';
import type { ID_of } from '../../util/ID';
import type User from '../../server/room/User';
import { make_id_of } from '../../util/ID';
import log from '../../util/log';

type AddUserEvent = {
  type: 'add_user',
  user_id: ID_of<User>,
  user_data: any,
};

type JoinRoomEvent = {
  type: 'initialize',
  participant_user_data: { [ID_of<User>]: any },
};

type UserEvent = AddUserEvent | JoinRoomEvent;

export default class UserDataStore<TUserData>
  implements IEventConsumer<UserEvent> {
  users: Map<ID_of<User>, TUserData>;
  validateUserData: any => TUserData | null;

  constructor(validate_user_data: any => TUserData | null) {
    this.users = new Map();
    this.validateUserData = validate_user_data;
  }

  castEvent(event: Object): UserEvent | null {
    return ['add_user', 'initialize'].includes(event.type)
      ? (event: UserEvent)
      : null;
  }

  ingestEvent(event: UserEvent): boolean {
    switch (event.type) {
      case 'add_user':
        log.info({
          type: 'add_user',
          message: `add user ${String(event.user_id)}`,
        });
        let validated_user_data = this.validateUserData(event.user_data);
        if (validated_user_data === null) {
          return false;
        }
        this.users.set(event.user_id, validated_user_data);
        return true;
      case 'initialize':
        let initial_user_ids = Array.from(
          Object.keys(event.participant_user_data),
        );
        log.info({
          type: 'initialize',
          message:
            'initialize state. Initial users are:' +
            initial_user_ids.toString(),
          initial_user_ids,
        });
        for (let [user_id, user_data] of Object.entries(
          event.participant_user_data,
        )) {
          let validated_user_data = this.validateUserData(user_data);
          if (validated_user_data === null) {
            continue;
          }
          this.users.set(make_id_of(user_id), validated_user_data);
        }
        return true;
    }
    return false;
  }

  getUserData() {
    let to_ret = {};
    for (let [key, val] of this.users.entries()) {
      to_ret[String(key)] = val;
    }
    return to_ret;
  }
}
