import { ROOM_LIST, KICK_VOTING_LIST } from './storage';

export function resolveVoting(key: string, voteID: string): boolean {
  const votesNumber = KICK_VOTING_LIST.find(voting => voting.id === voteID)?.votes.length;
  const membersNumber = ROOM_LIST[key].members.length;
  const calcVotes = Math.round(((votesNumber || 0) / +membersNumber) * 100);
  return calcVotes > 50 ? true : false;
}
