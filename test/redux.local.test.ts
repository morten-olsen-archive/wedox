import { Host, reducer, middleware, setup, remote } from '../src';
import { Store, createStore, applyMiddleware } from 'redux';
import { reset, getPeer } from '../__mocks__/peerjs';

const hostReducer = (state = {}, action: any) => {
  switch (action.type) {
    case 'DOSTUFF':
      return action.payload;
    default:
      return state;
  }
};

describe('redux.local', () => {
  let hostStore: Store;
  let host: Host;
  let clientStore: Store;

  beforeEach(async () => {
    reset();
    hostStore = createStore(hostReducer);
    host = await Host.create({
      pass: 'demo',
      store: hostStore,
    });
    clientStore = createStore(
      reducer(hostReducer),
      applyMiddleware(middleware())
    );
  });

  it('should be able to dispatch with local first', async () => {
    await Promise.resolve(clientStore.dispatch(setup(host.id)));
    const id = clientStore.getState().id;
    const channel = getPeer(id).channels[host.id];
    channel.active = false;
    const promise = clientStore.dispatch(
      remote({
        type: 'DOSTUFF',
        payload: {
          hello: 'world',
        },
      })
    );
    expect(clientStore.getState().state).toEqual({
      hello: 'world',
    });
    expect(clientStore.getState().waiting).toHaveLength(1);
    channel.active = true;
    channel.processQueue();
    await Promise.resolve(promise);
    expect(clientStore.getState().state).toEqual({
      hello: 'world',
    });
    expect(clientStore.getState().waiting).toHaveLength(0);
  });
});
