import express from 'express';
import { Request, Response } from 'express';
import cors from 'cors';
import http from 'http';
import WebSocket from 'ws';

const PORT = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server }, () => {
  console.log('server started');
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

wss.on('connection', (ws: WebSocket): void => {
  ws.on('message', (message: WebSocket.Data) => {
    const data = JSON.parse(message.toString());
    switch (data.event) {
      case 'connection':
        break;
      case 'message':
        break;
    }
  });

  ws.send('hello from server');
});

app.get('/', (req: Request, res: Response): void => {
  res.json({ result: 'hello' });
});

server.listen(PORT, () => {
  console.log(`Server has been started on port ${PORT}`);
});
