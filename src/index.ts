import { ExtWebSocket, ExtServer, IErrorMessage } from './types';
import { WSMethods } from './constants';
import express from 'express';
import { Request, Response } from 'express';
import cors from 'cors';
import http from 'http';
import WebSocket from 'ws';
import { MessageEvent } from 'ws';
import {
  addIssueToRoom,
  addMemberToRoom,
  changeRoute,
  changeSettings,
  createNewRoom,
  removeIssueFromRoom,
  removeMemberFromRoom,
  removeRoom,
} from './controllers/roomController';
import { ROOM_LIST } from './storage';

const PORT = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app);
const wss: ExtServer = new WebSocket.Server({ server });
wss.connections = new Set<ExtWebSocket>();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
        removeRoom(event, wss);
        console.log('room removed');
        break;
      }
      case WSMethods.addMember: {
        addMemberToRoom(event, ws, wss);
        console.log('added member');
        break;
      }
      case WSMethods.removeMember: {
        removeMemberFromRoom(event, wss);
        console.log('member removed');
        break;
      }
      case WSMethods.addIssue: {
        addIssueToRoom(event, wss);
        console.log('added issue');
        break;
      }
      case WSMethods.removeIssue: {
        removeIssueFromRoom(event, wss);
        console.log('issue removed');
        break;
      }
      case WSMethods.changeSettings: {
        changeSettings(event);
        console.log('settings changed');
        break;
      }
      case WSMethods.changeRoute: {
        changeRoute(event, wss);
        console.log('route changed');
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
});

app.get('/', (req: Request, res: Response): void => {
  res.json({ result: 'hello' });
});

server.listen(PORT, () => {
  console.log(`Server has been started on port ${PORT}`);
});
