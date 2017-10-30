// @flow

import UserManager from '../UserManager';
import dataProvider from '../../../util/test/dataProvider';
import { captureException } from '../../../util/test/captureException';
import log from '../../../util/log';
import expect from 'expect';

describe('UserManager', () => {
  describe('addOrRecoverUser', () => {
    let test_socket = {
      id: 'foo',
    };

    let test_user_id = 'really-unique-user-id';
    let manager = new UserManager();

    beforeEach(() => {
      manager = new UserManager();
    });

    it('should create a user for the given ID with a given socket', () => {
      // Precondition: user is not tracked by the manager
      expect(manager.isUserConnected(test_user_id)).toEqual(false);

      // Add the user to the manager
      manager.addOrRecoverUser(test_user_id, test_socket);
      expect(manager.isUserConnected(test_user_id)).toEqual(true);

      // Check that the socket was returned as expected
      let user_in_manager = expect(manager.getUser(test_user_id));
      expect(user_in_manager.socket).toEqual(test_socket);
    });

    it('should log an add_user message when a user is sucessfully added', () => {
      manager.addOrRecoverUser(test_user_id, test_socket);
      let e = captureException(() =>
        manager.addOrRecoverUser(test_user_id, test_socket),
      );
      expect(e.type).toEqual('duplicate_connection');
    });
  });

  describe('removeUser', () => {
    it('should error when the user is not in the manager');
    it('should remove the user from the room manager and their current room');
    it('should delete the room the user is in if they were the last connected' +
      ' user in the room');
  });

  describe('disconnectUser', () => {
    it('should mark a user as disconnected in the manager');
    it('should delete the room the user is in if they were the last connected' +
      ' user in the room');
  });

  describe('addUserToRoom', () => {
    it('should create a new room if no room with that room_id exists');
    it('should add a user to the room if a room with that room_id exists');
    it('should throw an exception if the user is not tracked by the user' +
      ' manager');
    it('should thrown an exception if the user is marked as disconnected');
  });

  describe('getRoomForUser', () => {
    it('should return the room the user is in when the user is in a room');
    it('should return null when the user is not in a room');
  })

  describe('getUser', () => {
    it('should return the user when they exist in the manager');
    it('should return null when the user does not exist in the manager');
  });
});
