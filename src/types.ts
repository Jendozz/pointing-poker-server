import { WSMethods } from './constants';

import WebSocket, { Server } from 'ws';

export interface ExtWebSocket extends WebSocket {
  id: string;
}

export interface ExtServer extends Server {
  connections?: Set<ExtWebSocket>;
}

export interface IUser {
  firstName: string;
  lastName?: string;
  jobPostion?: string;
  urlToImage?: string;
  role: string;
}

export interface IIssue {
  title: string;
  priority: string;
  link: string;
}

export interface IGameSettings {
  ScrumMasterAsPlayer: boolean;
  changingCardInRoundEnd: boolean;
  isTimerNeeded: boolean;
  scoreType: string;
  scoreTypeShort: string;
  timer?: string;
  cards: { sequence: 'pow of 2' | 'fibonacci'; count: number };
}

export interface IRoom {
  roomKey?: string;
  scrumMaster: IUser;
  members: IUser[];
  issues: IIssue[];
  gameSettings: IGameSettings;
}

export interface IMesssage {
  method: keyof typeof WSMethods,
  roomKey: string
}

export interface IErrorMessage {
  method: 'error'
  data: string
}

export interface ICreateRoomMessage {
  method: keyof typeof WSMethods;
  data: IRoom;
}

export interface IAddMemberToRoomMessage extends IMesssage{
  data: IUser;
};
export interface IResponseMembers extends IMesssage{
  data: IUser[];
}
export interface IAddIssueToRoomMessage extends IMesssage{
  data: IIssue;
}
export interface IResponseIssues extends IMesssage{
  data: IIssue[];
}
export interface IChangeSettingsMessage extends IMesssage {
  data: IGameSettings;
}

/*
  + create lobby - создает лобби, генерирует roomKey, записывает юзера создавшего лобби как скрам мастера и возвращает
    roomKey на клинет скрам мастера
  + add member - добавляет пользователя на сервере, возвращает данные о комнате этому пользователю
    а всем остальным возвращает новый массив members.
  - remove member - удаляет пользователя на сервере и возвращает всем клиентам новый массив members.
  + add issue - создает issue на сервере и возвращает всем клиентам новый массив issues
  - remove issue - удаляет issue на сервере и возвращает всем клиентам новый массив issues
  + change settings - принимает измененные настройки и сохраняет их на сервере 
  */
