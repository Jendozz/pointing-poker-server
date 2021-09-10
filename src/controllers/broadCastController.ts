import { WSMethods } from './../constants';

import { ExtServer, ExtWebSocket,} from '../types';

function broadCastMessage(connections: Set<ExtWebSocket>, roomKey: string, message: string) {
  connections.forEach(connection => {
    if (connection.id === roomKey) {
      connection.send(message);
    }
  });
}

export function broadCast<T>(wss: ExtServer, roomKey: string, method: keyof typeof WSMethods, data: T): void {
  if (wss.connections) {
    const message = {
      method: method,
      data: data
    };
    broadCastMessage(wss.connections, roomKey, JSON.stringify(message));
  }
}
