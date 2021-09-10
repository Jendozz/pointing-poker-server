
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

import { ROOM_LIST } from '../storage';
import { broadCast } from './broadCastController';

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

export function addMemberToRoom(event: MessageEvent, ws: ExtWebSocket, wss: ExtServer): void {
  const message: IAddMemberToRoomMessage = JSON.parse(event.data.toString());
  const key = message.roomKey;
  ws.id = key;
  wss.connections?.add(ws);
  if (ROOM_LIST[key]) {
    ROOM_LIST[key].members.push(message.data);
    const res:ICreateRoomMessage = {
      method: 'createRoom',
      data: ROOM_LIST[key]
    };
    ws.send(JSON.stringify(res));
    broadCast(wss, key, 'addMember', ROOM_LIST[key].members);
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

export function changeSettings(event: MessageEvent): void {
  const message: IChangeSettingsMessage = JSON.parse(event.data.toString());
  const key = message.roomKey;
  if (ROOM_LIST[key]) {
    ROOM_LIST[key].gameSettings = message.data;
  }
}

