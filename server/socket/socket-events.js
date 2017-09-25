import socketio from "socket.io";
import RoomManager from "./RoomManager";

let roomManager = new RoomManager();

let bindClientEvents = socket => {
  socket.on("join_room", (room_id, room_secret) => {
    room = roomManager.getRoom(room_id, room_secret);
    // Join a room fam
    if (room !== null) {
      socket.join(room_id);
      room.addParticipant(socket);
    } else {
      socket.send({
        type: "join_request_failed"
      });
    }
  });

  socket.on("disconnect", () => this.roomManager.removeClient(socket.id));
};

let io = new socketio();
io.on("connect", socket => {
  console.log("got socket client", socket.id);
  bindClientEvents(socket);
});

export default io;
