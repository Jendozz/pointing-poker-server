import { INTERVAL_LIST, ROOM_LIST } from './../storage';
import { broadCast } from './broadCastController';

function reduceTime(currentValue: string): string {
  const arr = currentValue.split(':');
  if (arr.length === 2) {
    const numbArr = [Number(arr[0]), Number(arr[1])];
    if (numbArr[1] <= 59 && numbArr[1] > 0) {
      if (numbArr[1] <= 10) {
        return numbArr[0] > 9 ? `${numbArr[0]}:0${numbArr[1] - 1}` : `0${numbArr[0]}:0${numbArr[1] - 1}`;
      }
      return numbArr[0] > 9 ? `${numbArr[0]}:${numbArr[1] - 1}` : `0${numbArr[0]}:${numbArr[1] - 1}`;
    } else if (numbArr[1] === 0 && numbArr[0] !== 0) {
      return numbArr[0] > 10 ? `${numbArr[0] - 1}:59` : `0${numbArr[0] - 1}:59`;
    } else {
      return '';
    }
  }
  return currentValue;
}

export function clearTimer(roomKey: string): void {
  if (INTERVAL_LIST[roomKey]) {
    clearInterval(INTERVAL_LIST[roomKey]);
    delete INTERVAL_LIST[roomKey];
  }
  if (ROOM_LIST[roomKey]) {
    ROOM_LIST[roomKey].game.remainingRoundTime = ROOM_LIST[roomKey].gameSettings.timer;
  }
}

export function startTimer(roomKey: string): void {
  if (ROOM_LIST[roomKey] && ROOM_LIST[roomKey].gameSettings.isTimerNeeded) {
    ROOM_LIST[roomKey].game.remainingRoundTime = ROOM_LIST[roomKey].gameSettings.timer;
    const interval = setInterval(() => {
      const newTime = reduceTime(ROOM_LIST[roomKey].game.remainingRoundTime);
      if (newTime) {
        ROOM_LIST[roomKey].game.remainingRoundTime = newTime;
        broadCast(roomKey, 'updateGame', ROOM_LIST[roomKey].game);
      } else {
        clearTimer(roomKey);
      }
    }, 1000);
    INTERVAL_LIST[roomKey] = interval;
  }
}
