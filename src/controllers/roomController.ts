import { IResponseKeyMessage } from './../types';
import { WSResMethods } from '../constants';
import {
  ICreateRoomMessage,
  ExtWebSocket,
  ExtServer,
  IAddMemberToRoomMessage,
  IAddIssueToRoomMessage,
  IChangeSettingsMessage,
} from '../types';
import { MessageEvent } from 'ws';

import { ROOM_LIST } from '../storage';
import { broadCastIssues, broadCastMembers } from './braodCastController';

export function createNewRoom(event: MessageEvent, ws: ExtWebSocket, wss: ExtServer): void {
  const data: ICreateRoomMessage = JSON.parse(event.data.toString());
  const key = String(Date.now());
  data.room.roomKey = key;
  ws.id = key;
  wss.connections?.add(ws);
  ROOM_LIST[key] = data.room;
  const message: IResponseKeyMessage = {
    method: WSResMethods.roomKey,
    roomKey: key,
  };
  ws.send(JSON.stringify(message));
}

export function addMemberToRoom(event: MessageEvent, ws: ExtWebSocket, wss: ExtServer): void {
  const data: IAddMemberToRoomMessage = JSON.parse(event.data.toString());
  const key = data.value.roomKey;
  ws.id = key;
  wss.connections?.add(ws);
  if (ROOM_LIST[key]) {
    ROOM_LIST[key].members.push(data.value.user);
    const message = {
      method: WSResMethods.room,
      room: ROOM_LIST[key],
    };
    ws.send(JSON.stringify(message));
    broadCastMembers(wss, key);
  }
}

export function addIssueToRoom(event: MessageEvent, wss: ExtServer): void {
  const data: IAddIssueToRoomMessage = JSON.parse(event.data.toString());
  const key = data.value.roomKey;
  if (ROOM_LIST[key]) {
    ROOM_LIST[key].issues.push(data.value.issue);
    broadCastIssues(wss, key);
  }
}

export function changeSettings(event: MessageEvent): void {
  const data: IChangeSettingsMessage = JSON.parse(event.data.toString());
  const key = data.value.roomKey;
  if (ROOM_LIST[key]) {
    ROOM_LIST[key].gameSettings = data.value.gameSettings;
  }
}
