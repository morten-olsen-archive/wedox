import { AnyAction } from 'redux';

export const remote = (action: AnyAction) => ({
  type: '@@REMOTE/DISPATCH',
  payload: action,
});

export const setup = (hostId: string) => ({
  type: '@@REMOTE/SETUP',
  payload: hostId,
});
