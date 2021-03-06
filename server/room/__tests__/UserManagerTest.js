import UserManager from '../UserManager';
import dataProvider from '../../../util/test/dataProvider';
import { captureException } from '../../../util/test/captureException';
import MockSocket from '../../../util/test/MockSocket';
import log from '../../../util/log';
import expect from 'expect';

describe('UserManager', () => {
  let test_socket_1, test_socket_2, manager;

  let test_user_id_1 = 'really-unique-user-id-1';
  let test_user_id_2 = 'really-unique-user-id-2';
  let test_nonce_1 = 'nonce-1';
  let test_nonce_2 = 'nonce-2';
  let bad_nonce = 'bad_nonce';
  let test_room_id_1 = 'really-unique-room-id-1';

  beforeEach(() => {
    // Generate new UserManager to avoid issues with state
    manager = new UserManager();
    test_socket_1 = new MockSocket('test-socket-id-1');
    test_socket_2 = new MockSocket('test-socket-id-2');

    // Mock logging to stifle messages
    log.debug = jest.fn();
  });

  describe('connectUserSession', () => {
    describe('when the user exists', () => {
      beforeEach(() => {
        manager.createUser(test_user_id_1, test_nonce_1);
      });
      it('should connect the user if the nonce matches', () => {
        manager.connectUserSession(test_user_id_1, test_nonce_1, test_socket_1);
        let user = manager.users.get(test_user_id_1);
        expect(user).not.toBeNull();
        expect(user).toBeDefined();
        expect(user.connected).toEqual(true);
        expect(user.socket).toEqual(test_socket_1);
      });
      it('should throw if the nonce does not match', () => {
        let exception = captureException(() =>
          manager.connectUserSession(test_user_id_1, bad_nonce, test_socket_1),
        );
        expect(exception.type).toEqual('incorrect_nonce');
      });
    });
    describe('when the user does not exist', () => {
      it('should throw', () => {
        let exception = captureException(() =>
          manager.connectUserSession(
            test_user_id_1,
            test_nonce_1,
            test_socket_1,
          ),
        );
        expect(exception.type).toEqual('connect_nonexistant_user');
      });
    });
  });

  describe('removeUser', () => {
    it('should error when the user is not in the manager', () => {
      let exception = captureException(() =>
        manager.removeUser(test_user_id_1),
      );
      expect(exception.type).toEqual('user_not_in_manager');
    });
    it('should remove the user from the room manager and their current room', () => {
      manager.createUser(test_user_id_1, test_nonce_1);
      manager.connectUserSession(test_user_id_1, test_nonce_1, test_socket_1);
      manager.addUserToRoom(test_user_id_1, test_room_id_1);
      expect(manager.getRoomForUser(test_user_id_1)).not.toEqual(null);
      manager.removeUser(test_user_id_1);
      expect(manager.getRoomForUser(test_user_id_1)).toEqual(null);
    });
    it(
      'should delete the room the user is in if there are no other users' +
        ' in the room',
      () => {
        // Precond:ition: user 1 is in room 1
        manager.createUser(test_user_id_1, test_nonce_1);
        manager.connectUserSession(test_user_id_1, test_nonce_1, test_socket_1);
        manager.addUserToRoom(test_user_id_1, test_room_id_1);
        expect(manager.getRoom(test_room_id_1)).not.toEqual(null);
        // Remove user 1 from the room and expect to room to be deleted
        manager.removeUser(test_user_id_1);
        expect(manager.getRoom(test_room_id_1)).toEqual(null);
      },
    );
    it('should not delete the room the user is in if there are other connected users user in the room', () => {
      // Precondition: users 1 and 2 are in room 1
      manager.createUser(test_user_id_1, test_nonce_1);
      manager.connectUserSession(test_user_id_1, test_nonce_1, test_socket_1);
      manager.createUser(test_user_id_2, test_nonce_2);
      manager.connectUserSession(test_user_id_2, test_nonce_2, test_socket_2);
      manager.addUserToRoom(test_user_id_1, test_room_id_1);
      manager.addUserToRoom(test_user_id_2, test_room_id_1);
      expect(manager.getRoom(test_room_id_1)).not.toEqual(null);
      // Remove user1 from the room and expect the room to still exist
      manager.removeUser(test_user_id_1);
      expect(manager.getRoom(test_room_id_1)).not.toEqual(null);
    });
    it('should delete the room the user is in if there are other users in the room, but they are disconnected', () => {
      // Precondition: users 1 and 2 are in room 1, user 2 is disconnected
      manager.createUser(test_user_id_1, test_nonce_1);
      manager.connectUserSession(test_user_id_1, test_nonce_1, test_socket_1);
      manager.createUser(test_user_id_2, test_nonce_2);
      manager.connectUserSession(test_user_id_2, test_nonce_2, test_socket_2);
      manager.addUserToRoom(test_user_id_1, test_room_id_1);
      manager.addUserToRoom(test_user_id_2, test_room_id_1);
      expect(manager.getRoom(test_room_id_1)).not.toEqual(null);
      manager.disconnectUser(test_user_id_2);
      // Remove user1 from the room and expect the room to be deleted
      manager.removeUser(test_user_id_1);
      expect(manager.getRoom(test_room_id_1)).toEqual(null);
    });
  });

  describe('disconnectUser', () => {
    it('should mark a user as disconnected in the manager', () => {
      manager.createUser(test_user_id_1, test_nonce_1);
      manager.connectUserSession(test_user_id_1, test_nonce_1, test_socket_1);
      manager.addUserToRoom(test_user_id_1, test_room_id_1);
      manager.disconnectUser(test_user_id_1);
      let user1 = manager.getUser(test_user_id_1);
      expect(user1).not.toBeNull();
      expect(user1.connected).toEqual(false);
    });
    it(
      'should delete the room the user is in if they were the last connected' +
        ' user in the room',
      () => {
        manager.createUser(test_user_id_1, test_nonce_1);
        manager.connectUserSession(test_user_id_1, test_nonce_1, test_socket_1);
        manager.addUserToRoom(test_user_id_1, test_room_id_1);
        manager.disconnectUser(test_user_id_1);
        expect(manager.getRoom(test_room_id_1)).toEqual(null);
      },
    );
  });

  describe('addUserToRoom', () => {
    it('should create a new room containing the user if no room with that room_id exists', () => {
      manager.createUser(test_user_id_1, test_nonce_1);
      manager.createUser(test_user_id_2, test_nonce_2);
      manager.connectUserSession(test_user_id_1, test_nonce_1, test_socket_1);
      manager.connectUserSession(test_user_id_2, test_nonce_2, test_socket_2);
      expect(manager.getRoom(test_room_id_1)).toEqual(null);
      manager.addUserToRoom(test_user_id_1, test_room_id_1);
      let room = manager.getRoom(test_room_id_1);
      let room_participants = room.getParticipantIDs();
      expect(room_participants).toEqual([test_user_id_1]);
    });
    it('should add a user to the room if a room with that room_id exists', () => {
      manager.createUser(test_user_id_1, test_nonce_1);
      manager.connectUserSession(test_user_id_1, test_nonce_1, test_socket_1);
      manager.createUser(test_user_id_2, test_nonce_2);
      manager.connectUserSession(test_user_id_2, test_nonce_2, test_socket_2);
      expect(manager.getRoom(test_room_id_1)).toEqual(null);
      manager.addUserToRoom(test_user_id_1, test_room_id_1);
      manager.addUserToRoom(test_user_id_2, test_room_id_1);
      let room = manager.getRoom(test_room_id_1);
      let room_participants = room.getParticipantIDs();
      expect(room_participants.sort()).toEqual(
        [test_user_id_1, test_user_id_2].sort(),
      );
    });
    it('should throw an exception if the user is not tracked by the user manager', () => {
      let exception = captureException(() =>
        manager.addUserToRoom(test_user_id_1, test_room_id_1),
      );
      expect(exception.type).toEqual('add_untracked_user');
    });
    it('should throw an exception if the user is marked as disconnected', () => {
      manager.createUser(test_user_id_1, test_nonce_1);
      manager.connectUserSession(test_user_id_1, test_nonce_1, test_socket_1);
      manager.disconnectUser(test_user_id_1);
      let exception = captureException(() =>
        manager.addUserToRoom(test_user_id_1, test_room_id_1),
      );
      expect(exception.type).toEqual('add_disconnected_user');
    });
  });

  describe('getRoomForUser', () => {
    it('should return the room the user is in when the user is in a room', () => {
      manager.createUser(test_user_id_1, test_nonce_1);
      manager.connectUserSession(test_user_id_1, test_nonce_1, test_socket_1);
      manager.addUserToRoom(test_user_id_1, test_room_id_1);
      let room = manager.getRoomForUser(test_user_id_1);
      expect(room).not.toEqual(null);
      expect(room.id).toEqual(test_room_id_1);
    });
    it('should return null when the user is not in a room', () => {
      manager.createUser(test_user_id_1, test_nonce_1);
      manager.connectUserSession(test_user_id_1, test_nonce_1, test_socket_1);
      let room = manager.getRoomForUser(test_user_id_1);
      expect(room).toEqual(null);
    });
  });

  describe('getRoom', () => {
    it('should return the room the user is in when the user is in a room', () => {
      // Rooms can only exist when a user is in them, so add a user to the manager
      // then add them to the room.
      manager.createUser(test_user_id_1, test_nonce_1);
      manager.connectUserSession(test_user_id_1, test_nonce_1, test_socket_1);
      manager.addUserToRoom(test_user_id_1, test_room_id_1);
      let room = manager.getRoom(test_room_id_1);
      expect(room).not.toEqual(null);
      expect(room.id).toEqual(test_room_id_1);
    });
    it('should return null when the user is not in a room', () => {
      let room = manager.getRoom(test_room_id_1);
      expect(room).toEqual(null);
    });
  });

  describe('getUser', () => {
    it('should return the user when they exist in the manager', () => {
      manager.createUser(test_user_id_1, test_nonce_1);
      manager.connectUserSession(test_user_id_1, test_nonce_1, test_socket_1);
      let user = manager.getUser(test_user_id_1);
      expect(user).not.toEqual(null);
      expect(user.id).toEqual(test_user_id_1);
    });
    it('should return null when the user does not exist in the manager', () => {
      let user = manager.getUser(test_user_id_1);
      expect(user).toEqual(null);
    });
  });
});
