import { ROOM_LIST, KICK_VOTING_LIST } from './storage';
import { ExtWebSocket, ICreateRoomMessage, IMesssage, Routes, IChangeRouteMessage } from './types';

export function resolveVoting(key: string, voteID: string): boolean {
  const votesNumber = KICK_VOTING_LIST.find(voting => voting.id === voteID)?.votes.length;
  const membersNumber = ROOM_LIST[key].members.length;
  const calcVotes = Math.round(((votesNumber || 0) / +membersNumber) * 100);
  return calcVotes > 50 ? true : false;
}

export function login(roomKey: string): IMesssage {
  const message: IMesssage = {
    method: 'login',
    roomKey,
  };
  return message;
}

export function createRoomOnClient(key: string, ws: ExtWebSocket): void {
  const res: ICreateRoomMessage = {
    method: 'createRoom',
    data: ROOM_LIST[key],
  };
  ws.send(JSON.stringify(res));
  ws.send(JSON.stringify(login(key)));
}

export function createRouteMessage(route: keyof typeof Routes, roomKey: string): string {
  const message: IChangeRouteMessage = {
    method: 'changeRoute',
    roomKey: roomKey,
    data: route,
  };
  return JSON.stringify(message);
}

export function RemoveWSFromConnections(connections: Set<ExtWebSocket>, userid: string): void {
  connections.forEach(connection => {
    if (connection.userid === userid) {
      connections.delete(connection);
    }
  });
}
export function RemoveRoomFromConnections(connections: Set<ExtWebSocket>, id: string): void {
  connections.forEach(connection => {
    if (connection.id === id) {
      connections.delete(connection);
    }
  });
}

export function getExtFromFileName(name: string): string {
  const arr = name.split('.');
  return arr[arr.length - 1];
}

export function findAvatarById(list: string[], id: string): string {
  let result = '';
  list.forEach(el => {
    if (el.includes(id)) {
      result = el;
    }
  });
  return result;
}
