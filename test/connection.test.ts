import { Host, Client } from '../src';
import { Store, createStore } from 'redux';
import { reset } from '../__mocks__/peerjs';

describe('connection', () => {
  let store: Store;
  let host: Host;

  beforeEach(async () => {
    reset();
    store = createStore(
      (s: any[] = [], a) => [...s, a],
    );
    host = await Host.create({
      pass: 'demo',
      store,
    });
  })

  it('should be able to create a host', async () => {
    expect(host.id).toBeDefined();
  });

  it('should be able to connect a client', async () => {
    const client = await Client.create(host.id, {});
    const response = await client.send({
      type: 'hello',
      payload: 'world',
    });
    expect(response).toBe(true);
    expect(host.state).toHaveLength(2);
    expect(host.state[1]).toEqual({
      type: 'hello',
      payload: 'world',
    })
  })
})

