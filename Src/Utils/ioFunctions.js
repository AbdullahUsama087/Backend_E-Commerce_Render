import { Server } from "socket.io";

let io;
function intiateIO(server) {
  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
    allowEIO3: true,
  });
  return io;
}

function getIO() {
  if (!io) {
    return new Error("No IO Found");
  }
  return io;
}

export { intiateIO, getIO };
