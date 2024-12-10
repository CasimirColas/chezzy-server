import { decodeBoard } from "@/chess/chess.js";
import {
  ClassicGameEngine,
  type ClassicServerGameRequest,
} from "@/chess/classic.js";
import type { NamespaceIO, SocketIO } from "@/types/socket.js";

export class ClassicRoom {
  white: string | undefined;
  black: string | undefined;
  spectators: string[];
  ongoing: boolean;
  game?: ClassicGameEngine;

  constructor(player1: string) {
    this.white = player1;
    this.black = undefined;
    this.spectators = [];
    this.ongoing = false;
  }

  join(player: string) {
    if (!this.white) {
      this.white = player;
    } else if (!this.black) {
      this.black = player;
    } else {
      this.spectators.push(player);
    }
  }

  leave(player: string) {
    if (this.white === player) {
      this.white = undefined;
    } else if (this.black === player) {
      this.black = undefined;
    } else {
      const index = this.spectators.indexOf(player);
      if (index !== -1) {
        this.spectators.splice(index, 1);
      }
    }
  }

  swapColors() {
    [this.white, this.black] = [this.black, this.white];
  }

  startGame(startingFen?: string) {
    if (startingFen) {
      try {
        const game = decodeBoard(startingFen);
        this.game = new ClassicGameEngine(game);
      } catch (error) {
        throw new Error("Invalid FEN, cause: " + error);
      }
    } else {
      this.game = new ClassicGameEngine();
    }
    this.ongoing = true;
  }

  makeMove(player: string, req: ClassicServerGameRequest) {
    if (!this.game) {
      throw new Error("Game not started");
    }
    const game = this.game.info().game;
    if ((this.white === player) === game.whiteToPlay) {
      this.game.request(req);
    } else {
      throw new Error("Not your turn");
    }
  }

  gameInfo() {
    if (!this.game) {
      throw new Error("Game not started");
    }
    return this.game.info();
  }
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

    socket.on("disconnect", () => {
      const roomsIds = Object.keys(rooms).filter((roomId) =>
        [
          ...rooms[roomId].spectators,
          rooms[roomId].white,
          rooms[roomId].black,
        ].includes(socket.id)
      );
      for (const roomId of roomsIds) {
        leaveRoom(socket, roomId);
      }
    });
  });

  function joinRoom(socket: SocketIO, roomId: string) {
    // Id of rooms available on the server
    const roomsIds = Object.keys(rooms);

    // Check if a user wants to join an existing room or creates and joins a new room
    if (roomsIds.includes(roomId)) {
      const { spectators, white, black } = rooms[roomId];
      const users = [...spectators, white, black].filter(
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
      rooms[roomId].join(socket.id);
    } else {
      // User creates and joins a new room
      rooms[roomId] = new ClassicRoom(socket.id);
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
    rooms[roomId].leave(socket.id);

    io.to(roomId).emit("roomUpdate", rooms[roomId]);
  }

  function makeMove() {}
}

export default classicLobby;
