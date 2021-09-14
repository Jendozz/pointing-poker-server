import { IChangeRouteMessage, IChangeIssueInRoomMessage } from './../types';

import {
  ICreateRoomMessage,
  ExtWebSocket,
  ExtServer,
  IAddMemberToRoomMessage,
  IAddIssueToRoomMessage,
  IChangeSettingsMessage,
  IMesssage,
} from '../types';
import { MessageEvent } from 'ws';

import { ROOM_LIST, VOTE_LIST } from '../storage';
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

export function removeRoom(event: MessageEvent, wss: ExtServer): void {
  const message: IMesssage = JSON.parse(event.data.toString());
  const key = message.roomKey;
  if (ROOM_LIST[key]) {
    delete ROOM_LIST[key];
    broadCast(wss, key, 'removeRoom', {});
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
    broadCast(wss, key, 'addMember', ROOM_LIST[key].members);
  }
}

export function removeMemberFromRoom(event: MessageEvent, wss: ExtServer): void {
  const message: IAddMemberToRoomMessage = JSON.parse(event.data.toString());
  const key = message.roomKey;
  if (ROOM_LIST[key]) {
    ROOM_LIST[key].members = ROOM_LIST[key].members.filter(member => member.id !== message.data.id);
    broadCast(wss, key, 'addMember', ROOM_LIST[key].members);
    broadCast(wss, key, 'removeMember', message.data.id);
  }
}

export function startKickVoting(event: MessageEvent, wss: ExtServer): void {
  const message: IAddMemberToRoomMessage = JSON.parse(event.data.toString());
  const key = message.roomKey;
  const getVoteResult = () => {
    const verdict = resolveVoting(key);
    if (verdict) {
      removeMemberFromRoom(event, wss);
      broadCast(wss, key, 'resetVoting', key);
      // const voteIndex = VOTE_LIST.findIndex(voting => voting.roomKey === key);
      // VOTE_LIST.splice(voteIndex, 1);
    }
  };

  if (ROOM_LIST[key]) {
    const isVotingStarted = VOTE_LIST.find(voting => voting.roomKey === key);
    if (!isVotingStarted) {
      VOTE_LIST.push({ roomKey: key, votes: [true] });
      setTimeout(getVoteResult, VOTING_DELAY);
      broadCast(wss, key, 'kickVoting', message.data);
    } else {
      VOTE_LIST.find(voting => voting.roomKey === key)?.votes.push(true);
      getVoteResult();
    }
  }
}

export function addIssueToRoom(event: MessageEvent, wss: ExtServer): void {
  const message: IAddIssueToRoomMessage = JSON.parse(event.data.toString());
  const key = message.roomKey;
  if (ROOM_LIST[key]) {
    ROOM_LIST[key].issues.push(message.data);
    broadCast(wss, key, 'addIssue', ROOM_LIST[key].issues);
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

export function removeIssueFromRoom(event: MessageEvent, wss: ExtServer): void {
  const message: IAddIssueToRoomMessage = JSON.parse(event.data.toString());
  const key = message.roomKey;
  if (ROOM_LIST[key]) {
    ROOM_LIST[key].issues = ROOM_LIST[key].issues.filter(issue => issue.id !== message.data.id);
    broadCast(wss, key, 'addIssue', ROOM_LIST[key].issues);
  }
}

export function changeSettings(event: MessageEvent): void {
  const message: IChangeSettingsMessage = JSON.parse(event.data.toString());
  const key = message.roomKey;
  if (ROOM_LIST[key]) {
    ROOM_LIST[key].gameSettings = message.data;
  }
}

export function changeRoute(event: MessageEvent, wss: ExtServer): void {
  const message: IChangeRouteMessage = JSON.parse(event.data.toString());
  const key = message.roomKey;
  if (ROOM_LIST[key]) {
    ROOM_LIST[key].route = message.data;
  }
  broadCast(wss, key, 'changeRoute', ROOM_LIST[key].route);
}
