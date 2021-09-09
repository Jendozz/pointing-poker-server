import { ExtWebSocket, ExtServer } from './types';
import { WSReqMethods } from './constants';
import express from 'express';
import { Request, Response } from 'express';
import cors from 'cors';
import http from 'http';
import WebSocket from 'ws';
import { MessageEvent } from 'ws';
import { addIssueToRoom, addMemberToRoom, changeSettings, createNewRoom } from './controllers/roomController';
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
      case WSReqMethods.connection:
        break;
      case WSReqMethods.createRoom: {
        createNewRoom(event, ws, wss);
        console.log(ROOM_LIST);
        break;
      }
      case WSReqMethods.addMember: {
        addMemberToRoom(event, ws, wss);
        console.log('added member');
        break;
      }
      case WSReqMethods.addIssue: {
        addIssueToRoom(event, wss);
        console.log('added issue');
        break;
      }
      case WSReqMethods.changeSettings: {
        changeSettings(event);
        console.log('settings changed');
        break;
      }
      default:
        ws.send(JSON.stringify({ error: 'your message did not match api schema' }));
        break;
    }
  };
});

app.get('/', (req: Request, res: Response): void => {
  res.json({ result: 'hello' });
});

server.listen(PORT, () => {
  console.log(`Server has been started on port ${PORT}`);
});
