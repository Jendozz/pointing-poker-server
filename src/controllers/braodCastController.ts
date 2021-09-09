import { WSResMethods } from '../constants';
import { ROOM_LIST } from '../storage';

import { ExtServer, IResponseMembers, IResponseIssues, ExtWebSocket } from '../types';

function broadCastMessage(connections: Set<ExtWebSocket>, roomKey: string, message: string) {
  connections.forEach(connection => {
    if (connection.id === roomKey) {
      connection.send(message);
    }
  });
}

export function broadCastMembers(wss: ExtServer, roomKey: string): void {
  if (wss.connections) {
    const message: IResponseMembers = {
      method: WSResMethods.members,
      members: ROOM_LIST[roomKey].members,
    };
    broadCastMessage(wss.connections, roomKey, JSON.stringify(message));
  }
}

export function broadCastIssues(wss: ExtServer, roomKey: string): void {
  if (wss.connections) {
    const message: IResponseIssues = {
      method: WSResMethods.issues,
      issues: ROOM_LIST[roomKey].issues,
    };
    broadCastMessage(wss.connections, roomKey, JSON.stringify(message));
  }
}
