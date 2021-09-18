import {
  IChangeRouteMessage,
  IChangeIssueInRoomMessage,
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
import { createRoomOnClient, login, resolveVoting } from '../helpers';
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
  ws.send(JSON.stringify(login(key)));
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
    broadCast(key, 'addMember', ROOM_LIST[key].members);
  }
}

function waitAnswerFromScrumMaster(
  ws: ExtWebSocket,
  connection: ExtWebSocket,
  event: MessageEvent,
  wss: ExtServer,
  waitingEvent: string,
) {
  const message: IAddMemberToRoomMessage = JSON.parse(event.data.toString());
  const key = message.roomKey;
  ws.id = key;
  wss.connections?.add(ws);
  const handleEvent = (e: MessageEvent) => {
    const answer: IAddMemberToRoomMessage = JSON.parse(e.data.toString());
    if (answer.method === waitingEvent && answer.data.id === message.data.id) {
      createRoomOnClient(key, ws);
      broadCast(key, 'addMember', ROOM_LIST[key].members);
      ws.send(JSON.stringify(login(key)));
      connection.removeEventListener('message', handleEvent);
    }
    if (answer.method === 'rejectLogin' && answer.data.id === message.data.id) {
      ws.send(JSON.stringify(login('')));
      connection.removeEventListener('message', handleEvent);
    }
  };
  connection.addEventListener('message', handleEvent);
}

export function askForJoinMember(event: MessageEvent, ws: ExtWebSocket, wss: ExtServer): void {
  const message: IAddMemberToRoomMessage = JSON.parse(event.data.toString());
  const key = message.roomKey;
  if (ROOM_LIST[key]) {
    if (!ROOM_LIST[key].gameSettings.addPlayerWhenGameStarted && ROOM_LIST[key].route === 'game') {
      wss.connections?.forEach(CONNECTION => {
        if (CONNECTION.id === key) {
          waitAnswerFromScrumMaster(ws, CONNECTION, event, wss, 'addMember');
        }
      });
      broadCast(key, 'attachmentMemberRequest', message.data);
    } else {
      addMemberToRoom(event, ws, wss);
      createRoomOnClient(key, ws);
    }
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

export function startKickVoting(event: MessageEvent): void {
  const message: IAddMemberToRoomMessage = JSON.parse(event.data.toString());
  const key = message.roomKey;
  const voteID = `${key}-${message.data.id}`;
  if (ROOM_LIST[key]) {
    const voteIndex = KICK_VOTING_LIST.findIndex(voting => voting.id === voteID);
    const getVoteResult = (deleteVoting: boolean) => {
      const index = KICK_VOTING_LIST.findIndex(voting => voting.id === voteID);
      const verdict = resolveVoting(key, voteID);
      if (verdict) {
        removeMemberFromRoom(event);
        KICK_VOTING_LIST[index].isEnded = true;
      }
      if (deleteVoting) {
        KICK_VOTING_LIST.splice(index, 1);
        broadCast(key, 'resetKickUserVoting', key);
      }
    };
    if (voteIndex < 0) {
      KICK_VOTING_LIST.push({ id: voteID, votes: [true], isEnded: false });
      setTimeout(() => {
        getVoteResult(true);
      }, VOTING_DELAY);
      broadCast(key, 'startKickUserVoting', message.data);
    } else if (!KICK_VOTING_LIST[voteIndex].isEnded) {
      KICK_VOTING_LIST[voteIndex].votes.push(true);
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
export function changeIssueInRoom(event: MessageEvent): void {
  const message: IChangeIssueInRoomMessage = JSON.parse(event.data.toString());
  const key = message.roomKey;
  if (ROOM_LIST[key]) {
    const index = ROOM_LIST[key].issues.findIndex(issue => issue.id === message.data.id);
    if (typeof index === 'number') {
      ROOM_LIST[key].issues[index] = message.data.issue;
      broadCast(key, 'addIssue', ROOM_LIST[key].issues);
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
