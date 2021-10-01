import { WSMethods } from './constants';

import WebSocket, { Server } from 'ws';
import { Readable } from 'stream';

export interface ExtWebSocket extends WebSocket {
  id: string;
  userid: string;
}

export interface ExtServer extends Server {
  connections?: Set<ExtWebSocket>;
}

export interface MulterRequest extends Express.Request {
  body: {
    userId: string;
  };
  file: {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
    stream: Readable;
    destination: string;
    filename: string;
    path: string;
  };
}

export interface IUser {
  id: string;
  firstName: string;
  lastName?: string;
  jobPostion?: string;
  urlToImage?: string;
  role: string;
}

export interface IIssue {
  id: string;
  title: string;
  priority: string;
  link: string;
}

export interface IGameSettings {
  ScrumMasterAsPlayer: boolean;
  changingCardInRoundEnd: boolean;
  isTimerNeeded: boolean;
  scoreType: keyof IScoreTypes;
  scoreTypeShort: string;
  flipCardsWhenAllVoted: boolean;
  addPlayerWhenGameStarted: boolean;
  timer: string;
  cards: number;
}

export interface IScoreTypes {
  'power of 2': number[];
  'story point': number[];
  fibonacci: number[];
}
export enum Routes {
  firstPage = 'firstPage',
  lobby = 'lobby',
  game = 'game',
  result = 'result',
}

export interface IRoom {
  roomKey: string;
  scrumMaster: IUser;
  members: IUser[];
  issues: IIssue[];
  gameSettings: IGameSettings;
  route: keyof typeof Routes;
  game: {
    activeIssueId: string;
    vote: { [key: string]: { userId: string; voice: number }[] };
    remainingRoundTime: string;
    cardsIsFlipped: boolean;
  };
  chatMessages: IChatMessage[];
}

export interface IChatMessage {
  userid: string;
  userName: string;
  urlToAvatar: string;
  message: string;
  date: number;
}
export interface IMesssage {
  method: keyof typeof WSMethods;
  roomKey: string;
}

export interface IErrorMessage {
  method: 'error';
  data: string;
}

export interface IKickVoting {
  id: string;
  votes: boolean[];
  isEnded: boolean;
}

export interface ICreateRoomMessage {
  method: keyof typeof WSMethods;
  data: IRoom;
}

export interface IAddMemberToRoomMessage extends IMesssage {
  data: IUser;
}
export interface IResponseMembers extends IMesssage {
  data: IUser[];
}
export interface IAddIssueToRoomMessage extends IMesssage {
  data: IIssue;
}
export interface IChangeIssueInRoomMessage extends IMesssage {
  data: {
    issue: IIssue;
    id: string;
  };
}
export interface IResponseIssues extends IMesssage {
  data: IIssue[];
}
export interface IChangeSettingsMessage extends IMesssage {
  data: IGameSettings;
}
export interface IChangeRouteMessage extends IMesssage {
  data: keyof typeof Routes;
}
export interface IAddChatMessage extends IMesssage {
  data: IChatMessage;
}

export interface IUpdateGameMessage extends IMesssage {
  data: {
    activeIssueId: string;
    vote: { [key: string]: { userId: string; voice: number }[] };
    remainingRoundTime: string;
    cardsIsFlipped: boolean;
  };
}
