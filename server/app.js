import http from "http";
import io from "./socket-events";
import app from "./express-app";

/**
 * Shared entrypoint for the socketio server and express app.
 * Exports a brunch-server compatible function so that the socketio server and
 * express server can be run under `brunch w --server`
 */

export default function makeServer() {
  let server = http.Server(app);
  io.attach(server);

  return server;
}
