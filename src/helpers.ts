import { ROOM_LIST, VOTE_LIST } from './storage';

export function resolveVoting(key: string): boolean {
  const votesNumber = VOTE_LIST.find(voting => voting.roomKey === key)?.votes.length;
  const membersNumber = ROOM_LIST[key].members.length;
  const calcVotes = Math.round(((votesNumber || 0) / +membersNumber) * 100);
  return calcVotes > 50 ? true : false;
}
