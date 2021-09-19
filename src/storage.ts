import { IKickVoting, IRoom } from './types';

export const ROOM_LIST: { [key: string]: IRoom } = {};

export const KICK_VOTING_LIST: IKickVoting[] = [];

export const INTERVAL_LIST: { [key: string]: NodeJS.Timer } = {};
