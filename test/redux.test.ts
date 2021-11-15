import { Host, reducer, middleware, setup, remote } from '../src';
import { Store, createStore, applyMiddleware } from 'redux';
import { reset } from '../__mocks__/peerjs';

const hostReducer = (s: any = { data: [] }, a: any) => ({
  data: [...s.data, a],
});

describe('redux', () => {
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
    clientStore = createStore(reducer(), applyMiddleware(middleware()));
  });

  it('should be able to setup a store', async () => {
    await Promise.resolve(clientStore.dispatch(setup(host.id)));
    expect(clientStore.getState().ready).toBe(true);
    expect(clientStore.getState().state.data).toHaveLength(1);
  });

  it('should be able to dispatch to remote store', async () => {
    await Promise.resolve(clientStore.dispatch(setup(host.id)));
    await Promise.resolve(
      clientStore.dispatch(
        remote({
          type: 'hello',
          payload: 'world',
        })
      )
    );
    expect(clientStore.getState().state.data).toHaveLength(2);
    expect(clientStore.getState().state.data[1]).toEqual({
      type: 'hello',
      payload: 'world',
    });
  });

  it('should dispatch error if dispatching without a setup client', async () => {
    await Promise.resolve(
      clientStore.dispatch(
        remote({
          type: 'hello',
          payload: 'world',
        })
      )
    );
    expect(clientStore.getState().error).toBe('Client not set up');
  });

  it('should allow passthough action', async () => {
    await Promise.resolve(
      clientStore.dispatch({
        type: 'hello',
        payload: 'world',
      })
    );
    expect(clientStore.getState()).toEqual({
      ready: false,
      state: {},
      waiting: [],
    });
  });
});
