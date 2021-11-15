import { Middleware } from 'redux';
import Client from './connection/Client';

const middleware = (): Middleware => () => (next) => {
  let client: Client | undefined;
  let actionId: 0;

  const setup = async (hostId: string) => {
    client = await Client.create(hostId, {});
    client.on('state', (state) => {
      next({
        type: '@@REMOTE/STATE',
        payload: state,
      });
    });
    next({
      type: '@@REMOTE/READY',
      payload: client.id,
    });
    return next({
      type: '@@REMOTE/STATE',
      payload: client.state,
    });
  };

  return (action) => {
    if (action.type === '@@REMOTE/SETUP') {
      return setup(action.payload);
    }
    if (action.type === '@@REMOTE/DISPATCH') {
      if (!client) {
        return next({
          type: '@@REMOTE/ERROR',
          payload: 'Client not set up',
        });
      }
      const id = actionId++;
      next({
        type: '@@REMOTE/BEGIN',
        payload: action.payload,
        meta: {
          id,
        },
      });
      return client.send(action.payload).then(() => {
        next({
          type: '@@REMOTE/END',
          meta: {
            id,
          },
        });
      });
    }
    return next(action);
  };
};

export default middleware;
