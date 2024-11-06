import type { NamespaceIO } from "@/utils/types.js";

function doubleLobby(io: NamespaceIO) {
  io.on("connect", (s) => {
    s.emit("hello", "welcome to the DOUBLE lobby");
  });
}
export default doubleLobby;
