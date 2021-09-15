import {
  IChangeRouteMessage, 
  IChangeIssueInRoomMessage ,
  ICreateRoomMessage,
  ExtWebSocket,
  ExtServer,
  IAddMemberToRoomMessage,
  IAddIssueToRoomMessage,
  IChangeSettingsMessage,
  IMesssage,
} from '../types';
import { MessageEvent } from 'ws';
import { ROOM_LIST, KICK_VOTING_LIST } from '../storage';
import { broadCast } from './broadCastController';
import { resolveVoting } from '../helpers';
import { VOTING_DELAY } from '../constants';

export function createNewRoom(event: MessageEvent, ws: ExtWebSocket, wss: ExtServer): void {
  const message: ICreateRoomMessage = JSON.parse(event.data.toString());
  const key = String(Date.now());
  message.data.roomKey = key;
  ws.id = key;
  wss.connections?.add(ws);
  ROOM_LIST[key] = message.data;
  const res: IMesssage = {
    method: 'roomKey',
    roomKey: key,
  };
  ws.send(JSON.stringify(res));
}

export function removeRoom(event: MessageEvent): void {
  const message: IMesssage = JSON.parse(event.data.toString());
  const key = message.roomKey;
  if (ROOM_LIST[key]) {
    delete ROOM_LIST[key];
    broadCast(key, 'removeRoom', {});
  }
}

export function addMemberToRoom(event: MessageEvent, ws: ExtWebSocket, wss: ExtServer): void {
  const message: IAddMemberToRoomMessage = JSON.parse(event.data.toString());
  const key = message.roomKey;
  ws.id = key;
  wss.connections?.add(ws);
  if (ROOM_LIST[key]) {
    ROOM_LIST[key].members.push(message.data);
    const res: ICreateRoomMessage = {
      method: 'createRoom',
      data: ROOM_LIST[key],
    };
    ws.send(JSON.stringify(res));
    broadCast(key, 'addMember', ROOM_LIST[key].members);
  }
}

export function removeMemberFromRoom(event: MessageEvent): void {
  const message: IAddMemberToRoomMessage = JSON.parse(event.data.toString());
  const key = message.roomKey;
  if (ROOM_LIST[key]) {
    ROOM_LIST[key].members = ROOM_LIST[key].members.filter(member => member.id !== message.data.id);
    broadCast(key, 'addMember', ROOM_LIST[key].members);
    broadCast(key, 'removeMember', message.data.id);
  }
}

export function startKickVoting(event: MessageEvent, wss: ExtServer): void {
  const message: IAddMemberToRoomMessage = JSON.parse(event.data.toString());
  const key = message.roomKey;
  const voteID = `${key}-${message.data.id}`;
  if (ROOM_LIST[key]) {
    const voteIndex = KICK_VOTING_LIST.findIndex(voting => voting.id === voteID);
    const getVoteResult = (deleteVoting: boolean) => {
      const verdict = resolveVoting(key, voteID);
      if (verdict && !deleteVoting) {
        removeMemberFromRoom(event, wss);
        KICK_VOTING_LIST[voteIndex].isEnded = true;
      }
      if (deleteVoting) {
        KICK_VOTING_LIST.splice(voteIndex, 1);
        broadCast(wss, key, 'resetKickUserVoting', key);
      }
    };
    if (voteIndex < 0) {
      KICK_VOTING_LIST.push({ id: voteID, votes: [true], isEnded: false });
      setTimeout(() => {
        getVoteResult(true);
      }, VOTING_DELAY);
      broadCast(wss, key, 'startKickUserVoting', message.data);
    } else if (!KICK_VOTING_LIST[voteIndex].isEnded) {
      KICK_VOTING_LIST.find(voting => voting.id === voteID)?.votes.push(true);
      getVoteResult(false);
    }
  }
}

export function addIssueToRoom(event: MessageEvent): void {
  const message: IAddIssueToRoomMessage = JSON.parse(event.data.toString());
  const key = message.roomKey;
  if (ROOM_LIST[key]) {
    ROOM_LIST[key].issues.push(message.data);
    broadCast(key, 'addIssue', ROOM_LIST[key].issues);
  }
}
export function changeIssueInRoom(event: MessageEvent, wss: ExtServer): void {
  const message: IChangeIssueInRoomMessage = JSON.parse(event.data.toString());
  const key = message.roomKey;
  if (ROOM_LIST[key]) {
    const index = ROOM_LIST[key].issues.findIndex(issue => issue.id === message.data.id);
    if (typeof index === 'number') {
      ROOM_LIST[key].issues[index] = message.data.issue;
      broadCast(wss, key, 'addIssue', ROOM_LIST[key].issues);
    }
  }
}

export function removeIssueFromRoom(event: MessageEvent): void {
  const message: IAddIssueToRoomMessage = JSON.parse(event.data.toString());
  const key = message.roomKey;
  if (ROOM_LIST[key]) {
    ROOM_LIST[key].issues = ROOM_LIST[key].issues.filter(issue => issue.id !== message.data.id);
    broadCast(key, 'addIssue', ROOM_LIST[key].issues);
  }
}

export function changeSettings(event: MessageEvent): void {
  const message: IChangeSettingsMessage = JSON.parse(event.data.toString());
  const key = message.roomKey;
  console.log(message);

  if (ROOM_LIST[key]) {
    ROOM_LIST[key].gameSettings = message.data;
  }
  broadCast(key, 'createRoom', ROOM_LIST[key]);
}

export function changeRoute(event: MessageEvent): void {
  const message: IChangeRouteMessage = JSON.parse(event.data.toString());
  const key = message.roomKey;
  if (ROOM_LIST[key]) {
    ROOM_LIST[key].route = message.data;
  }
  broadCast(key, 'changeRoute', ROOM_LIST[key].route);
}

export function setActiveIssue(event: MessageEvent): void {
  const message = JSON.parse(event.data.toString());
  const key = message.roomKey;
  if (ROOM_LIST[key]) {
    if (!ROOM_LIST[key].game.activeIssueId) {
      ROOM_LIST[key].game.activeIssueId = ROOM_LIST[key].issues[0]?.id;
    } else {
      const index = ROOM_LIST[key].issues.findIndex(issue => issue.id === ROOM_LIST[key].game.activeIssueId);
      if (!ROOM_LIST[key].issues[index + 1]) {
        ROOM_LIST[key].route = 'result';
        broadCast(key, 'changeRoute', ROOM_LIST[key].route);
      } else {
        ROOM_LIST[key].game.activeIssueId = ROOM_LIST[key].issues[index + 1]?.id;
      }
    }
  }
  ROOM_LIST[key].game.vote[ROOM_LIST[key].game.activeIssueId] = [];
  broadCast(key, 'updateGame', ROOM_LIST[key].game);
}

export function setVoice(event: MessageEvent): void {
  const {
    roomKey,
    data: { issueId, userId, voice },
  }: { roomKey: string; data: { issueId: string; userId: string; voice: number } } = JSON.parse(event.data.toString());
  ROOM_LIST[roomKey].game.vote[issueId].push({ userId: userId, voice: voice });
  console.log(ROOM_LIST[roomKey].game);
  broadCast(roomKey, 'updateGame', ROOM_LIST[roomKey].game);
}

export function resetRound(event: MessageEvent): void {
  const {
    roomKey,
    data: { issueId },
  }: { roomKey: string; data: { issueId: string } } = JSON.parse(event.data.toString());
  ROOM_LIST[roomKey].game.vote[issueId] = [];
  broadCast(roomKey, 'updateGame', ROOM_LIST[roomKey].game);
}
