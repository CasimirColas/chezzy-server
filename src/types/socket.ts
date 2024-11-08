import type { Socket, Namespace, DefaultEventsMap } from "socket.io";

type SocketIO = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  any
>;

type NamespaceIO = Namespace<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  any
>;

export type { NamespaceIO, SocketIO };
