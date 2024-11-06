import type { NamespaceIO, SocketIO } from "@/utils/types.js";

export interface ClassicRoom {
  player1: string | undefined;
  player2: string | undefined;
  spectators: string[];
}

export interface ClassicLobby {
  [key: string]: ClassicRoom;
}

function classicLobby(io: NamespaceIO) {
  let rooms: ClassicLobby = {};

  io.on("connect", (socket) => {
    socket.emit("hello", "welcome to the CLASSIC lobby");
    socket.on("joinRoom", (roomId) => {
      joinRoom(socket, roomId);
    });

    socket.on("leaveRoom", (roomId) => {
      leaveRoom(socket, roomId);
    });

    socket.onAny(() => {
      console.log(rooms);
    });
  });

  function joinRoom(socket: SocketIO, roomId: string) {
    // Id of rooms available on the server
    const roomsIds = Object.keys(rooms);

    // Check if a user wants to join an existing room or creates and joins a new room
    if (roomsIds.includes(roomId)) {
      const { spectators, player1, player2 } = rooms[roomId];
      const users = [...spectators, player1, player2].filter(
        (i) => i !== undefined
      );
      // Checks if the user is already in the room
      if (users.includes(socket.id)) {
        // Sends error message directly to the user
        io.to(socket.id).emit("error", {
          message: `Already joined room ${roomId}`,
        });
        return;
      }
      // User joins the room
      socket.join(roomId);
      // Asignment of the player to an available spot or spectator
      // User joined slot 1
      if (!rooms[roomId].player1) {
        rooms[roomId].player1 = socket.id;
        io.to(roomId).emit("roomUpdate", rooms[roomId]);
        return;
      }
      // User joined slot 2
      if (!rooms[roomId].player2) {
        rooms[roomId].player2 = socket.id;
        io.to(roomId).emit("roomUpdate", rooms[roomId]);
        return;
      }
      // User joined the spectators
      rooms[roomId].spectators.push(socket.id);
      io.to(roomId).emit("roomUpdate", rooms[roomId]);
    } else {
      // User creates and joins a new room
      rooms[roomId] = {
        player1: socket.id,
        player2: undefined,
        spectators: [],
      };
      socket.join(roomId);
    }
    io.to(roomId).emit("roomUpdate", rooms[roomId]);
  }

  function leaveRoom(socket: SocketIO, roomId: string) {
    // Checks if the room to exit exists
    if (!rooms[roomId]) {
      // Sends error message directly to the user
      io.to(socket.id).emit("error", {
        message: `Room ${roomId} does not exist`,
      });
      return;
    }
    // User leaves the room
    socket.leave(roomId);
    // Removing the user from the rooms state
    if (rooms[roomId].player1 === socket.id) {
      rooms[roomId].player1 = undefined;
    }
    if (rooms[roomId].player2 === socket.id) {
      rooms[roomId].player2 = undefined;
    }
    const index = rooms[roomId].spectators.indexOf(socket.id);
    if (index !== -1) {
      rooms[roomId].spectators.splice(index, 1);
    }
    io.to(roomId).emit("roomUpdate", rooms[roomId]);
  }
}

export default classicLobby;
