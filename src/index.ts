import path from 'path';
import { ExtWebSocket, ExtServer, IErrorMessage } from './types';
import { WSMethods } from './constants';
import express from 'express';
import cors from 'cors';
import http from 'http';
import WebSocket from 'ws';
import { MessageEvent } from 'ws';
import {
  addChatMessageToRoom,
  addIssueToRoom,
  addMemberToRoom,
  askForJoinMember,
  changeIssueInRoom,
  changeRoute,
  changeSettings,
  createNewRoom,
  disconnectHandler,
  removeIssueFromRoom,
  removeMemberFromRoom,
  removeRoom,
  resetRound,
  setActiveIssue,
  setVoice,
  startKickVoting,
  updateGame,
} from './controllers/roomController';
import { ROOM_LIST } from './storage';

const PORT = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app);
export const wss: ExtServer = new WebSocket.Server({ server });
wss.connections = new Set<ExtWebSocket>();

const router = require('./router');

app.use(express.static(path.resolve(__dirname, '../public')));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/', router);

wss.on('connection', (ws: ExtWebSocket) => {
  ws.onmessage = (event: MessageEvent) => {
    const { method } = JSON.parse(event.data.toString());
    switch (method) {
      case WSMethods.connection:
        break;
      case WSMethods.createRoom: {
        createNewRoom(event, ws, wss);
        console.log(ROOM_LIST);
        break;
      }
      case WSMethods.removeRoom: {
        removeRoom(event);
        console.log('room removed');
        break;
      }
      case WSMethods.addMember: {
        addMemberToRoom(event, ws, wss);
        console.log('added member');
        break;
      }
      case WSMethods.connectToRoom: {
        askForJoinMember(event, ws, wss);
        console.log('connectToRoom');
        break;
      }
      case WSMethods.removeMember: {
        removeMemberFromRoom(event, wss);
        console.log('member removed');
        break;
      }
      case WSMethods.startKickUserVoting: {
        startKickVoting(event, wss);
        console.log('start voting');
        break;
      }
      case WSMethods.addIssue: {
        addIssueToRoom(event);
        console.log('added issue');
        break;
      }
      case WSMethods.changeIssue: {
        changeIssueInRoom(event);
        console.log('issue changed');
        break;
      }
      case WSMethods.removeIssue: {
        removeIssueFromRoom(event);
        console.log('issue removed');
        break;
      }
      case WSMethods.changeSettings: {
        changeSettings(event);
        console.log('settings changed');
        break;
      }
      case WSMethods.changeRoute: {
        changeRoute(event);
        console.log('route changed');
        break;
      }
      case WSMethods.updateGame: {
        updateGame(event);
        console.log('game updated');
        break;
      }
      case WSMethods.setActiveIssue: {
        setActiveIssue(event);
        console.log('set active Issue');
        break;
      }
      case WSMethods.setVoice: {
        setVoice(event);
        console.log('set voice');
        break;
      }
      case WSMethods.resetRound: {
        resetRound(event);
        console.log('reset Round');
        break;
      }
      case WSMethods.rejectLogin: {
        console.log('rejectLogin');
        break;
      }
      case WSMethods.addChatMessage: {
        addChatMessageToRoom(event);
        console.log('message added');
        break;
      }
      case WSMethods.reconnect: {
        console.log(`ws from room ${ws.id} reconnected`);
        break;
      }
      default: {
        const message: IErrorMessage = {
          method: 'error',
          data: 'your message did not match api schema',
        };
        ws.send(JSON.stringify(message));
        break;
      }
    }
  };
  ws.on('close', () => {
    disconnectHandler(ws, wss);
    console.log(`User ${ws.userid} disconnected`);
  });
});

server.listen(PORT, () => {
  console.log(`Server has been started on port ${PORT}`);
});
