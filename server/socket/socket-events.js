import socketio from 'socket.io';
import RoomRouter from '../room/RoomRouter';

let roomRouter = new RoomRouter();

let bindClientEvents = socket => {
  roomRouter.addUser(socket);

  socket.on('join_room', room_id => {
    roomRouter.addUserToRoom(socket.id, room_id);
  });

  socket.on('event', event => {
    let room = roomRouter.getRoomForUser(socket.id);
    if (room) {
      room.processClientEvent(socket.id, event);
    } else {
      console.log(`client ${socket.id} is not in a room?`);
    }
  });

  socket.on('disconnect', () => roomRouter.removeUser(socket));
};

let io = new socketio();
io.on('connect', socket => {
  console.log('got socket client', socket.id);
  bindClientEvents(socket);
});

export default io;
