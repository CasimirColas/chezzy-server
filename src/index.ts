import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { Server } from "socket.io";
import classicLobby from "./lobbies/classic.js";
import doubleLobby from "./lobbies/double.js";

const app = new Hono();

const port = 3000;
console.log(`Server is running on http://localhost:${port}`);

const server = serve({
  fetch: app.fetch,
  port,
});

app.get("/", (c) => {
  io.emit("hello", "main");
  return c.text("Hello Hono!");
});

const io = new Server(server);
classicLobby(io.of("/classic"));
doubleLobby(io.of("/double"));

io.on("connection", (socket) => {
  console.log("client connected");
});

export { io, classicLobby };
