import { IUpdateGameMessage, GameRole } from './../types';
import {
  IAddChatMessage,
  IChangeRouteMessage,
  IChangeIssueInRoomMessage,
  ICreateRoomMessage,
  ExtWebSocket,
  ExtServer,
  IAddMemberToRoomMessage,
  IAddIssueToRoomMessage,
  IChangeSettingsMessage,
  IMesssage,
} from '../types';
import { MessageEvent } from 'ws';
import { ROOM_LIST, KICK_VOTING_LIST } from '../storage';
import { broadCast, sendNotification } from './broadCastController';
import {
  createRoomOnClient,
  createRouteMessage,
  login,
  RemoveRoomFromConnections,
  RemoveWSFromConnections,
  resolveVoting,
} from '../helpers';
import { VOTING_DELAY } from '../constants';
import { clearTimer, startTimer } from './timerController';

export function createNewRoom(event: MessageEvent, ws: ExtWebSocket, wss: ExtServer): void {
  const message: ICreateRoomMessage = JSON.parse(event.data.toString());
  const key = String(Date.now());
  message.data.roomKey = key;
  ws.id = key;
  ws.userid = message.data.scrumMaster.id;
  wss.connections?.add(ws);
  ROOM_LIST[key] = message.data;
  ROOM_LIST[key].route = 'lobby';
  const res: IMesssage = {
    method: 'roomKey',
    roomKey: key,
  };
  ws.send(JSON.stringify(res));
  ws.send(JSON.stringify(login(key)));
  ws.send(createRouteMessage('lobby', key));
}

export function removeRoom(event: MessageEvent): void {
  const message: IMesssage = JSON.parse(event.data.toString());
  const key = message.roomKey;
  if (ROOM_LIST[key]) {
    delete ROOM_LIST[key];
    broadCast(key, 'removeRoom', {});
    clearTimer(key);
  }
  sendNotification(key, 'room was succesfuly removed', 'success');
}

export function addMemberToRoom(event: MessageEvent, ws: ExtWebSocket, wss: ExtServer): void {
  const message: IAddMemberToRoomMessage = JSON.parse(event.data.toString());
  const key = message.roomKey;
  ws.id = key;
  ws.userid = message.data.id;
  wss.connections?.add(ws);
  if (ROOM_LIST[key]) {
    ROOM_LIST[key].members.push(message.data);
    broadCast(key, 'addMember', ROOM_LIST[key].members);
    broadCast(key, 'showNotification', {
      text: `${message.data.firstName + ' ' + message.data.lastName} connected`,
      isOpen: true,
      severity: 'info',
    });
  }
}
function waitAnswerFromScrumMaster(
  ws: ExtWebSocket,
  connection: ExtWebSocket,
  event: MessageEvent,
  wss: ExtServer,
  waitingEvent: string,
) {
  const message: IAddMemberToRoomMessage = JSON.parse(event.data.toString());
  const key = message.roomKey;
  ws.id = key;
  wss.connections?.add(ws);
  const handleEvent = (e: MessageEvent) => {
    const answer: IAddMemberToRoomMessage = JSON.parse(e.data.toString());
    if (answer.method === waitingEvent && answer.data.id === message.data.id) {
      createRoomOnClient(key, ws);
      broadCast(key, 'addMember', ROOM_LIST[key].members);
      ws.send(JSON.stringify(login(key)));
      connection.removeEventListener('message', handleEvent);
    }
    if (answer.method === 'rejectLogin' && answer.data.id === message.data.id) {
      ws.send(JSON.stringify(login('')));
      connection.removeEventListener('message', handleEvent);
    }
  };
  connection.addEventListener('message', handleEvent);
}

export function askForJoinMember(event: MessageEvent, ws: ExtWebSocket, wss: ExtServer): void {
  const message: IAddMemberToRoomMessage = JSON.parse(event.data.toString());
  const key = message.roomKey;
  if (ROOM_LIST[key]) {
    if (!ROOM_LIST[key].gameSettings.addPlayerWhenGameStarted && ROOM_LIST[key].route === 'game') {
      wss.connections?.forEach(CONNECTION => {
        if (CONNECTION.id === key) {
          waitAnswerFromScrumMaster(ws, CONNECTION, event, wss, 'addMember');
        }
      });
      broadCast(key, 'attachmentMemberRequest', message.data);
    } else {
      addMemberToRoom(event, ws, wss);
      createRoomOnClient(key, ws);
    }
  }
}

export function removeMemberFromRoom(event: MessageEvent, wss: ExtServer): void {
  const message: IAddMemberToRoomMessage = JSON.parse(event.data.toString());
  const key = message.roomKey;
  if (ROOM_LIST[key]) {
    ROOM_LIST[key].members = ROOM_LIST[key].members.filter(member => member.id !== message.data.id);
    broadCast(key, 'addMember', ROOM_LIST[key].members);
    broadCast(key, 'removeMember', message.data.id);
    sendNotification(key, `${message.data.firstName} left the room`, 'info');
    sendNotification(key, 'you were disconnected from the room', 'error', message.data.id);
    if (wss.connections) {
      RemoveWSFromConnections(wss.connections, message.data.id);
    }
  }
}

export function startKickVoting(event: MessageEvent, wss: ExtServer): void {
  const message: IAddMemberToRoomMessage = JSON.parse(event.data.toString());
  const key = message.roomKey;
  const voteID = `${key}-${message.data.id}`;
  if (ROOM_LIST[key]) {
    const voteIndex = KICK_VOTING_LIST.findIndex(voting => voting.id === voteID);
    const getVoteResult = (deleteVoting: boolean) => {
      const index = KICK_VOTING_LIST.findIndex(voting => voting.id === voteID);
      const verdict = resolveVoting(key, voteID);
      if (verdict) {
        removeMemberFromRoom(event, wss);
        KICK_VOTING_LIST[index].isEnded = true;
      }
      if (deleteVoting) {
        KICK_VOTING_LIST.splice(index, 1);
        broadCast(key, 'resetKickUserVoting', key);
      }
    };
    if (voteIndex < 0) {
      KICK_VOTING_LIST.push({ id: voteID, votes: [true], isEnded: false });
      setTimeout(() => {
        getVoteResult(true);
      }, VOTING_DELAY);
      broadCast(key, 'startKickUserVoting', message.data);
    } else if (!KICK_VOTING_LIST[voteIndex].isEnded) {
      KICK_VOTING_LIST[voteIndex].votes.push(true);
      getVoteResult(false);
    }
  }
}

export function addIssueToRoom(event: MessageEvent): void {
  const message: IAddIssueToRoomMessage = JSON.parse(event.data.toString());
  const key = message.roomKey;
  if (ROOM_LIST[key]) {
    ROOM_LIST[key].issues.push(message.data);
    broadCast(key, 'addIssue', ROOM_LIST[key].issues);
  }
}
export function changeIssueInRoom(event: MessageEvent): void {
  const message: IChangeIssueInRoomMessage = JSON.parse(event.data.toString());
  const key = message.roomKey;
  if (ROOM_LIST[key]) {
    const index = ROOM_LIST[key].issues.findIndex(issue => issue.id === message.data.id);
    if (typeof index === 'number') {
      ROOM_LIST[key].issues[index] = message.data.issue;
      broadCast(key, 'addIssue', ROOM_LIST[key].issues);
    }
  }
}

export function removeIssueFromRoom(event: MessageEvent): void {
  const message: IAddIssueToRoomMessage = JSON.parse(event.data.toString());
  const key = message.roomKey;
  if (ROOM_LIST[key]) {
    ROOM_LIST[key].issues = ROOM_LIST[key].issues.filter(issue => issue.id !== message.data.id);
    broadCast(key, 'addIssue', ROOM_LIST[key].issues);
  }
}

export function changeSettings(event: MessageEvent): void {
  const message: IChangeSettingsMessage = JSON.parse(event.data.toString());
  const key = message.roomKey;
  if (ROOM_LIST[key]) {
    ROOM_LIST[key].gameSettings = message.data;
  }
  broadCast(key, 'createRoom', ROOM_LIST[key]);
}

export function changeRoute(event: MessageEvent): void {
  const message: IChangeRouteMessage = JSON.parse(event.data.toString());
  const key = message.roomKey;
  if (ROOM_LIST[key]) {
    ROOM_LIST[key].route = message.data;
    ROOM_LIST[key].game.activeIssueId = '';
  }
  broadCast(key, 'changeRoute', ROOM_LIST[key].route);
  broadCast(key, 'updateGame', ROOM_LIST[key].game);
  clearTimer(key);
}

export function updateGame(event: MessageEvent): void {
  const message: IUpdateGameMessage = JSON.parse(event.data.toString());
  const key = message.roomKey;
  if (ROOM_LIST[key]) {
    ROOM_LIST[key].game = message.data;
  }
  broadCast(key, 'updateGame', ROOM_LIST[key].game);
}

export function setActiveIssue(event: MessageEvent): void {
  const message = JSON.parse(event.data.toString());
  const key = message.roomKey;
  if (ROOM_LIST[key]) {
    if (!ROOM_LIST[key].game.activeIssueId) {
      ROOM_LIST[key].game.activeIssueId = ROOM_LIST[key].issues[0]?.id;
      ROOM_LIST[key].game.cardsIsFlipped = false;
      clearTimer(key);
      startTimer(key);
    } else {
      const index = ROOM_LIST[key].issues.findIndex(issue => issue.id === ROOM_LIST[key].game.activeIssueId);
      if (!ROOM_LIST[key].issues[index + 1]) {
        clearTimer(key);
        ROOM_LIST[key].game.remainingRoundTime = '00:00';
        sendNotification(key, 'no issues left', 'error');
      } else {
        clearTimer(key);
        startTimer(key);
        ROOM_LIST[key].game.activeIssueId = ROOM_LIST[key].issues[index + 1]?.id;
        ROOM_LIST[key].game.cardsIsFlipped = false;
      }
    }
  }
  ROOM_LIST[key].game.vote[ROOM_LIST[key].game.activeIssueId] = [];
  broadCast(key, 'updateGame', ROOM_LIST[key].game);
}

export function setVoice(event: MessageEvent): void {
  const {
    roomKey,
    data: { issueId, userId, voice },
  }: { roomKey: string; data: { issueId: string; userId: string; voice: number } } = JSON.parse(event.data.toString());
  const votedIndex = ROOM_LIST[roomKey].game.vote[issueId].findIndex(vote => {
    return vote.userId === userId;
  });
  const {
    members,
    game,
    gameSettings: { flipCardsWhenAllVoted, ScrumMasterAsPlayer },
  } = ROOM_LIST[roomKey];
  const actualPlayers = members.filter(member => member.role === GameRole.player);
  if (votedIndex == -1) {
    game.vote[issueId].push({ userId: userId, voice: voice });
    if (
      flipCardsWhenAllVoted &&
      ((ScrumMasterAsPlayer && game.vote[issueId].length === actualPlayers.length + 1) ||
        (!ScrumMasterAsPlayer && game.vote[issueId].length === actualPlayers.length))
    ) {
      game.cardsIsFlipped = true;
    }
  } else {
    game.vote[issueId][votedIndex].voice = voice;
  }
  sendNotification(roomKey, 'your vote has been successfully taken into account', 'success', userId);
  broadCast(roomKey, 'updateGame', ROOM_LIST[roomKey].game);
}

export function resetRound(event: MessageEvent): void {
  const {
    roomKey,
    data: { issueId },
  }: { roomKey: string; data: { issueId: string } } = JSON.parse(event.data.toString());
  if (ROOM_LIST[roomKey]) {
    const { game } = ROOM_LIST[roomKey];
    game.vote[issueId] = [];
    game.remainingRoundTime = ROOM_LIST[roomKey].gameSettings.timer;
    game.cardsIsFlipped = false;
  }
  clearTimer(roomKey);
  startTimer(roomKey);
  broadCast(roomKey, 'updateGame', ROOM_LIST[roomKey].game);
  sendNotification(roomKey, 'Round was reset', 'warning');
}

export function addChatMessageToRoom(event: MessageEvent): void {
  const message: IAddChatMessage = JSON.parse(event.data.toString());
  const key = message.roomKey;
  if (ROOM_LIST[key]) {
    ROOM_LIST[key].chatMessages.push(message.data);
    broadCast(key, 'addChatMessage', ROOM_LIST[key].chatMessages);
  }
}

export function disconnectHandler(ws: ExtWebSocket, wss: ExtServer): void {
  if (ROOM_LIST[ws.id]) {
    if (ROOM_LIST[ws.id].scrumMaster.id === ws.userid) {
      delete ROOM_LIST[ws.id];
      broadCast(ws.id, 'removeRoom', {});
      clearTimer(ws.id);
      if (wss.connections) {
        RemoveRoomFromConnections(wss.connections, ws.id);
      }
    } else {
      ROOM_LIST[ws.id].members = ROOM_LIST[ws.id].members.filter(member => member.id !== ws.userid);
      broadCast(ws.id, 'addMember', ROOM_LIST[ws.id].members);
      broadCast(ws.id, 'removeMember', ws.userid);
      if (wss.connections) {
        RemoveWSFromConnections(wss.connections, ws.userid);
      }
    }
  }
}
