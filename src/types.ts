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
  cards: { value: string; name: string }[];
}

export interface IRoom {
  roomKey?: string;
  scrumMaster: IUser;
  members: IUser[];
  issues: IIssue[];
  gameSettings: IGameSettings;
}
export interface ICreateRoomMessage {
  method: string;
  room: IRoom;
}
export interface IResponseKeyMessage {
  method: string;
  roomKey: string;
}

export interface IAddMemberToRoomMessage {
  method: string;
  value: {
    roomKey: string;
    user: IUser;
  };
}
export interface IResponseMembers {
  method: string;
  members: IUser[];
}
export interface IAddIssueToRoomMessage {
  method: string;
  value: {
    roomKey: string;
    issue: IIssue;
  };
}
export interface IResponseIssues {
  method: string;
  issues: IIssue[];
}
export interface IChangeSettingsMessage {
  method: string;
  value: {
    roomKey: string;
    gameSettings: IGameSettings;
  };
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
