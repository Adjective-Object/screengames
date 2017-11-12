// @flow
import userListTemplate from './UserList.handlebars';
import type UserDataStore from '../../../common/UserDataStore';
import type { TPictionaryData } from '../../types';

export default class UserList {
  target: HTMLElement;

  constructor(target: HTMLElement) {
    this.target = target;
  }

  render(user_data_store: UserDataStore<TPictionaryData>) {
    this.target.innerHTML = userListTemplate({
      users: user_data_store.getUserData(),
    });
  }
}
