import { ROOM_LIST, KICK_VOTING_LIST } from './storage';
import { ExtWebSocket, ICreateRoomMessage, IMesssage } from './types';

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
