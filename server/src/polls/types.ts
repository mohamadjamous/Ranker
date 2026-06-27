import { Socket } from 'socket.io';
import { Request } from 'express';

export type CreatePollFields = {
  topic: string;
  votesPerVoter: number;
  name: string;
};

export type JoinPollFields = {
  pollID: string;
  name: string;
};

export type RejoinPollFields = {
  pollID: string;
  userID: string;
  name: string;
};


export interface AddParticipantFields {
  pollID: string,
  userID: string,
  name: string,
}

export interface RemoveParticipantData {
  pollID: string,
  userID: string,
}


// repository types
export type CreatePollData = {
  pollID: string;
  topic: string;
  votesPerVoter: number;
  userID: string;
};

export type AddParticipantData = {
  pollID: string;
  userID: string;
  name: string;
};


export type AuthPayload = {
  userID: string,
  pollID: string,
  name: string
};

export type RequestWithAuth = Request & AuthPayload;
export type SocketWithAuth = Socket & AuthPayload;