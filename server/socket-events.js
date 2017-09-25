import socketio from "socket.io";
import RoomManager from "./RoomManager";

let roomManager = new RoomManager();

let bindClientEvents = socket => {
  socket.on("join_room", (room_id, room_secret) => {
    if (roomManager.isRoomPassword(room_id, room_secret)) {
      room = roomManager.get(room_id);
      socket.join(room_id);
      socket.send({
        type: "join_request_success"
      });
    } else {
      socket.send({
        type: "join_request_failed"
      });
    }
  });
};

let io = socketio();
io.on("connect", socket => {
  console.log("got socket client", socket.id);
  bindClientEvents(socket);
});

export default io;
