import type { Socket, Namespace, DefaultEventsMap } from "socket.io";

export type SocketIO = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  any
>;

export type NamespaceIO = Namespace<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  any
>;
